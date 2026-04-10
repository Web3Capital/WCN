export type ChainConfig = {
  chainId: number;
  name: string;
  rpcUrl: string;
  usdcAddress: `0x${string}`;
  decimals: number;
};

export const CHAIN_CONFIGS: Record<string, ChainConfig> = {
  polygon: {
    chainId: 137,
    name: "Polygon PoS",
    rpcUrl: process.env.PAYMENT_RPC_URL ?? "https://polygon-rpc.com",
    usdcAddress: (process.env.USDC_CONTRACT_ADDRESS ?? "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359") as `0x${string}`,
    decimals: 6,
  },
  base: {
    chainId: 8453,
    name: "Base",
    rpcUrl: "https://mainnet.base.org",
    usdcAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    decimals: 6,
  },
  ethereum: {
    chainId: 1,
    name: "Ethereum",
    rpcUrl: "https://eth.llamarpc.com",
    usdcAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    decimals: 6,
  },
};

export function getChainConfig(chain?: string): ChainConfig {
  return CHAIN_CONFIGS[chain ?? "polygon"] ?? CHAIN_CONFIGS.polygon;
}
