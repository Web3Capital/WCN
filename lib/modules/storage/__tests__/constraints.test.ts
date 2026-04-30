import { describe, it, expect } from "vitest";
import { validateUpload, isAllowedMime, MAX_UPLOAD_BYTES } from "../constraints";

describe("isAllowedMime", () => {
  it("accepts common image types (case-insensitive)", () => {
    expect(isAllowedMime("image/png")).toBe(true);
    expect(isAllowedMime("image/jpeg")).toBe(true);
    expect(isAllowedMime("image/jpg")).toBe(true); // jpe?g pattern accepts both
    expect(isAllowedMime("image/JPG")).toBe(true);
    expect(isAllowedMime("IMAGE/PNG")).toBe(true);
    expect(isAllowedMime("image/webp")).toBe(true);
    expect(isAllowedMime("image/gif")).toBe(true);
  });

  it("accepts office documents", () => {
    expect(isAllowedMime("application/pdf")).toBe(true);
    expect(isAllowedMime("application/msword")).toBe(true);
    expect(isAllowedMime("application/vnd.openxmlformats-officedocument.wordprocessingml.document")).toBe(true);
    expect(isAllowedMime("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")).toBe(true);
  });

  it("rejects octet-stream and unknown binaries", () => {
    expect(isAllowedMime("application/octet-stream")).toBe(false);
    expect(isAllowedMime("application/x-msdownload")).toBe(false);
    expect(isAllowedMime("application/x-dosexec")).toBe(false);
  });

  it("rejects executables and scripts", () => {
    expect(isAllowedMime("application/x-sh")).toBe(false);
    expect(isAllowedMime("application/javascript")).toBe(false);
    expect(isAllowedMime("text/javascript")).toBe(false);
    expect(isAllowedMime("application/x-php")).toBe(false);
  });

  it("rejects empty / wrong-typed inputs", () => {
    expect(isAllowedMime("")).toBe(false);
    // @ts-expect-error testing runtime guard
    expect(isAllowedMime(null)).toBe(false);
    // @ts-expect-error testing runtime guard
    expect(isAllowedMime(undefined)).toBe(false);
    expect(isAllowedMime("image")).toBe(false);
    expect(isAllowedMime("/png")).toBe(false);
  });

  it("trims whitespace before matching", () => {
    expect(isAllowedMime("  image/png  ")).toBe(true);
  });
});

describe("validateUpload", () => {
  it("returns null for valid input", () => {
    expect(validateUpload({ contentType: "image/png", sizeBytes: 1024 })).toBeNull();
  });

  it("rejects MIME not on allowlist", () => {
    const r = validateUpload({ contentType: "application/x-sh", sizeBytes: 1024 });
    expect(r?.code).toBe("MIME_NOT_ALLOWED");
  });

  it("requires sizeBytes", () => {
    expect(validateUpload({ contentType: "image/png", sizeBytes: null })?.code).toBe("SIZE_REQUIRED");
    expect(validateUpload({ contentType: "image/png", sizeBytes: undefined })?.code).toBe("SIZE_REQUIRED");
  });

  it("rejects oversize", () => {
    const r = validateUpload({ contentType: "image/png", sizeBytes: MAX_UPLOAD_BYTES + 1 });
    expect(r?.code).toBe("SIZE_TOO_LARGE");
  });

  it("accepts boundary at exactly MAX_UPLOAD_BYTES", () => {
    expect(validateUpload({ contentType: "image/png", sizeBytes: MAX_UPLOAD_BYTES })).toBeNull();
  });
});
