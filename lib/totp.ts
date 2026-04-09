import crypto from "crypto";

const TOTP_PERIOD = 30;
const TOTP_DIGITS = 6;

function hmacSha1(key: Buffer, data: Buffer): Buffer {
  return crypto.createHmac("sha1", key).update(data).digest();
}

function dynamicTruncation(hmac: Buffer): number {
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return code % 10 ** TOTP_DIGITS;
}

function base32Decode(input: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleaned = input.replace(/=+$/, "").toUpperCase();
  let bits = 0;
  let value = 0;
  const output: number[] = [];
  for (const ch of cleaned) {
    const idx = alphabet.indexOf(ch);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      output.push((value >>> bits) & 0xff);
    }
  }
  return Buffer.from(output);
}

function generateTOTP(secret: string, counter: number): string {
  const key = base32Decode(secret);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = hmacSha1(key, buf);
  return dynamicTruncation(hmac).toString().padStart(TOTP_DIGITS, "0");
}

export function TOTPGenerate(): { secret: string; otpauthUrl: string } {
  const raw = crypto.randomBytes(20);
  const secret = base32Encode(raw);
  const otpauthUrl = `otpauth://totp/WCN?secret=${secret}&issuer=WCN&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD}`;
  return { secret, otpauthUrl };
}

export function TOTPVerify(secret: string, code: string, window = 1): boolean {
  const now = Math.floor(Date.now() / 1000);
  const counter = Math.floor(now / TOTP_PERIOD);
  for (let i = -window; i <= window; i++) {
    if (generateTOTP(secret, counter + i) === code) return true;
  }
  return false;
}

function base32Encode(buffer: Buffer): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      output += alphabet[(value >>> bits) & 0x1f];
    }
  }
  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 0x1f];
  }
  return output;
}
