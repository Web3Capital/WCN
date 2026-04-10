import { NextResponse } from "next/server";

export async function GET() {
  const { generateNonce } = await import("siwe");
  const nonce = generateNonce();
  return NextResponse.json({ nonce });
}
