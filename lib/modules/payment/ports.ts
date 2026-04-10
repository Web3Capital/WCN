/**
 * @wcn/payment — Port Definitions
 */

export interface PaymentPort {
  executeTransfer(params: { from: string; to: string; amount: bigint; tokenAddress: string; chainId: number }): Promise<{ txHash: string }>;
}
