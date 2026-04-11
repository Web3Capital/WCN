import { createWalletClient, createPublicClient, http, parseUnits, encodeFunctionData, type Hex } from "viem";
import { polygon, base, mainnet } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import type { PrismaClient } from "@prisma/client";
import { getChainConfig } from "./config";

const RECEIPT_TIMEOUT_MS = 120_000;

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

    const existing = await prisma.paymentExecution.findFirst({
      where: { cycleId, nodeId: line.nodeId, status: { in: ["SUBMITTED", "CONFIRMED"] } },
    });
    if (existing) continue;

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

    const chain = paymentConfig.chain ?? "polygon";

    let execution;
    try {
      execution = await prisma.$transaction(async (tx) => {
        const doubleCheck = await tx.paymentExecution.findFirst({
          where: { cycleId, nodeId: line.nodeId, status: { in: ["SUBMITTED", "CONFIRMED"] } },
        });
        if (doubleCheck) return null;
        return tx.paymentExecution.create({
          data: {
            cycleId,
            nodeId: line.nodeId,
            amount: line.allocation,
            chain,
            status: "SUBMITTED",
            submittedAt: new Date(),
          },
        });
      });
    } catch {
      continue;
    }
    if (!execution) continue;

    try {
      const config = getChainConfig(chain);
      const walletClient = getWalletClient(chain);
      const viemChain = CHAIN_MAP[chain] ?? polygon;

      const roundedAllocation = Math.round(line.allocation * 10 ** config.decimals) / 10 ** config.decimals;
      const amount = parseUnits(roundedAllocation.toString(), config.decimals);
      const data = encodeFunctionData({
        abi: ERC20_TRANSFER_ABI,
        functionName: "transfer",
        args: [paymentConfig.walletAddress as `0x${string}`, amount],
      });

      const txHash = await walletClient.sendTransaction({
        to: config.usdcAddress,
        data,
        chain: viemChain,
      } as any);

      await prisma.paymentExecution.update({
        where: { id: execution.id },
        data: { txHash, status: "SUBMITTED" },
      });

      const publicClient = createPublicClient({
        chain: viemChain,
        transport: http(config.rpcUrl),
      });

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
        timeout: RECEIPT_TIMEOUT_MS,
      });

      if (receipt.status === "success") {
        await prisma.paymentExecution.update({
          where: { id: execution.id },
          data: { status: "CONFIRMED", confirmedAt: new Date() },
        });
        executed++;
      } else {
        await prisma.paymentExecution.update({
          where: { id: execution.id },
          data: { status: "FAILED", failedAt: new Date(), errorMsg: "Transaction reverted on-chain" },
        });
        failed++;
      }
    } catch (err) {
      await prisma.paymentExecution.update({
        where: { id: execution.id },
        data: {
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
