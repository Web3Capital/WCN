import { describe, it, expect } from "vitest";
import {
  enforceTwoFactor,
  TwoFactorRequiredError,
  InvalidTwoFactorCodeError,
} from "../two-factor";

const verifyAlwaysOk = () => true;
const verifyAlwaysBad = () => false;

describe("enforceTwoFactor", () => {
  it("is a no-op when twoFactorEnabled is false", () => {
    expect(() =>
      enforceTwoFactor({ twoFactorEnabled: false, twoFactorSecret: null }, undefined),
    ).not.toThrow();
    expect(() =>
      enforceTwoFactor({ twoFactorEnabled: null, twoFactorSecret: null }, undefined),
    ).not.toThrow();
  });

  it("throws TwoFactorRequiredError when enabled but code missing", () => {
    expect(() =>
      enforceTwoFactor(
        { twoFactorEnabled: true, twoFactorSecret: "JBSWY3DPEHPK3PXP" },
        undefined,
        verifyAlwaysOk,
      ),
    ).toThrow(TwoFactorRequiredError);
    expect(() =>
      enforceTwoFactor(
        { twoFactorEnabled: true, twoFactorSecret: "JBSWY3DPEHPK3PXP" },
        "",
        verifyAlwaysOk,
      ),
    ).toThrow(TwoFactorRequiredError);
    expect(() =>
      enforceTwoFactor(
        { twoFactorEnabled: true, twoFactorSecret: "JBSWY3DPEHPK3PXP" },
        "   ",
        verifyAlwaysOk,
      ),
    ).toThrow(TwoFactorRequiredError);
  });

  it("treats missing secret as required (data-integrity guard)", () => {
    expect(() =>
      enforceTwoFactor(
        { twoFactorEnabled: true, twoFactorSecret: null },
        "123456",
        verifyAlwaysOk,
      ),
    ).toThrow(TwoFactorRequiredError);
  });

  it("throws InvalidTwoFactorCodeError when code is wrong", () => {
    expect(() =>
      enforceTwoFactor(
        { twoFactorEnabled: true, twoFactorSecret: "JBSWY3DPEHPK3PXP" },
        "999999",
        verifyAlwaysBad,
      ),
    ).toThrow(InvalidTwoFactorCodeError);
  });

  it("returns silently when verify accepts the code", () => {
    expect(() =>
      enforceTwoFactor(
        { twoFactorEnabled: true, twoFactorSecret: "JBSWY3DPEHPK3PXP" },
        "123456",
        verifyAlwaysOk,
      ),
    ).not.toThrow();
  });

  it("error message strings match the legacy throw values for UI compatibility", () => {
    try {
      enforceTwoFactor({ twoFactorEnabled: true, twoFactorSecret: null }, "");
    } catch (e) {
      expect((e as Error).message).toBe("2FA_REQUIRED");
    }
    try {
      enforceTwoFactor(
        { twoFactorEnabled: true, twoFactorSecret: "JBSWY3DPEHPK3PXP" },
        "999999",
        verifyAlwaysBad,
      );
    } catch (e) {
      expect((e as Error).message).toBe("INVALID_2FA_CODE");
    }
  });
});
