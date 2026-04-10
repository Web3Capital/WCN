import { createWalletClient, http, parseUnits, encodeFunctionData, type Hex } from "viem";
import { polygon, base, mainnet } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import type { PrismaClient } from "@prisma/client";
import { getChainConfig } from "./config";

const ERC20_TRANSFER_ABI = [
  {
    name: "transfer",
    type: "function",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

const CHAIN_MAP: Record<string, any> = { polygon, base, ethereum: mainnet };

function getWalletClient(chain: string) {
  const pk = process.env.PAYMENT_PRIVATE_KEY;
  if (!pk) throw new Error("PAYMENT_PRIVATE_KEY not set");

  const account = privateKeyToAccount(pk as Hex);
  const config = getChainConfig(chain);
  const viemChain = CHAIN_MAP[chain] ?? polygon;

  return createWalletClient({
    account,
    chain: viemChain,
    transport: http(config.rpcUrl),
  });
}

export async function executeSettlementPayout(
  prisma: PrismaClient,
  cycleId: string,
): Promise<{ executed: number; failed: number }> {
  const cycle = await prisma.settlementCycle.findUnique({ where: { id: cycleId } });
  if (!cycle || !["LOCKED", "EXPORTED"].includes(cycle.status)) {
    throw new Error("Cycle must be LOCKED or EXPORTED to execute payments");
  }

  const lines = await prisma.settlementLine.findMany({
    where: { cycleId },
    select: { id: true, nodeId: true, allocation: true },
  });

  let executed = 0;
  let failed = 0;

  for (const line of lines) {
    if (line.allocation <= 0) continue;

    const paymentConfig = await prisma.paymentConfig.findUnique({ where: { nodeId: line.nodeId } });
    if (!paymentConfig?.walletAddress) {
      await prisma.paymentExecution.create({
        data: {
          cycleId,
          nodeId: line.nodeId,
          amount: line.allocation,
          chain: "polygon",
          status: "FAILED",
          failedAt: new Date(),
          errorMsg: "No wallet address configured",
        },
      });
      failed++;
      continue;
    }

    try {
      const chain = paymentConfig.chain ?? "polygon";
      const config = getChainConfig(chain);
      const walletClient = getWalletClient(chain);

      const amount = parseUnits(line.allocation.toString(), config.decimals);
      const data = encodeFunctionData({
        abi: ERC20_TRANSFER_ABI,
        functionName: "transfer",
        args: [paymentConfig.walletAddress as `0x${string}`, amount],
      });

      const execution = await prisma.paymentExecution.create({
        data: {
          cycleId,
          nodeId: line.nodeId,
          amount: line.allocation,
          chain,
          status: "SUBMITTED",
          submittedAt: new Date(),
        },
      });

      const txHash = await walletClient.sendTransaction({
        to: config.usdcAddress,
        data,
        chain: CHAIN_MAP[chain] ?? polygon,
      } as any);

      await prisma.paymentExecution.update({
        where: { id: execution.id },
        data: { txHash, status: "CONFIRMED", confirmedAt: new Date() },
      });

      executed++;
    } catch (err) {
      await prisma.paymentExecution.create({
        data: {
          cycleId,
          nodeId: line.nodeId,
          amount: line.allocation,
          chain: paymentConfig.chain ?? "polygon",
          status: "FAILED",
          failedAt: new Date(),
          errorMsg: err instanceof Error ? err.message : "Unknown error",
        },
      });
      failed++;
    }
  }

  return { executed, failed };
}
