/**
 * Shared 2FA gate for credential-style auth providers (password, wallet, phone).
 *
 * Throws thrown errors are surfaced through NextAuth's pages.error so the UI
 * can prompt for a TOTP code or report an invalid one. Returning silently
 * would leave the user with no actionable signal.
 */

import { TOTPVerify } from "@/lib/totp";

export type TwoFactorUser = {
  twoFactorEnabled: boolean | null | undefined;
  twoFactorSecret: string | null | undefined;
};

export class TwoFactorRequiredError extends Error {
  constructor() {
    super("2FA_REQUIRED");
    this.name = "TwoFactorRequiredError";
  }
}

export class InvalidTwoFactorCodeError extends Error {
  constructor() {
    super("INVALID_2FA_CODE");
    this.name = "InvalidTwoFactorCodeError";
  }
}

/**
 * Enforces 2FA on a successful first-factor authentication.
 *
 * - When `user.twoFactorEnabled` is false/null, this is a no-op.
 * - When enabled but no `totpCode` is supplied, throws `TwoFactorRequiredError`.
 * - When the code is wrong, throws `InvalidTwoFactorCodeError`.
 * - When `twoFactorSecret` is missing despite the flag, treats as "required"
 *   rather than silently passing — a missing secret is a data-integrity bug
 *   that must not allow login.
 */
export function enforceTwoFactor(
  user: TwoFactorUser,
  totpCode: string | null | undefined,
  verify: (secret: string, code: string) => boolean = TOTPVerify,
): void {
  if (!user.twoFactorEnabled) return;
  const trimmed = (totpCode ?? "").trim();
  if (!trimmed || !user.twoFactorSecret) {
    throw new TwoFactorRequiredError();
  }
  if (!verify(user.twoFactorSecret, trimmed)) {
    throw new InvalidTwoFactorCodeError();
  }
}
