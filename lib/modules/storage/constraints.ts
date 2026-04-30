/**
 * Server-side validation for user-uploaded files.
 *
 * Layer 1 of three defense-in-depth layers around uploads:
 *   1. Schema validation (this module) — rejects unknown MIME types and
 *      oversize requests before a presigned URL is even minted.
 *   2. S3 POST presign (TODO follow-up) — uses content-length-range and
 *      starts-with conditions so the upload itself is bounded server-side
 *      regardless of what the client claims.
 *   3. Async malware scan — only the scanner may flip scanStatus to PASSED.
 *      Clients calling /api/files/:id/complete cannot.
 */

export const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_BYTES) || 50 * 1024 * 1024; // 50 MB

/**
 * MIME allowlist. Patterns are matched case-insensitively, anchored.
 * Add narrow types deliberately — never widen with `*\/*`.
 */
export const ALLOWED_MIME_PATTERNS: readonly RegExp[] = [
  /^image\/(png|jpe?g|gif|webp|svg\+xml|heic|heif)$/i,
  /^application\/pdf$/i,
  /^application\/(msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/i,
  /^application\/(vnd\.ms-excel|vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet)$/i,
  /^application\/(vnd\.ms-powerpoint|vnd\.openxmlformats-officedocument\.presentationml\.presentation)$/i,
  /^application\/(zip|x-zip-compressed|gzip|x-tar|x-7z-compressed)$/i,
  /^application\/json$/i,
  /^text\/(plain|csv|markdown|html)$/i,
  /^video\/(mp4|webm|quicktime)$/i,
  /^audio\/(mpeg|mp4|wav|webm|ogg)$/i,
];

export type UploadValidationError =
  | { code: "MIME_NOT_ALLOWED"; mime: string }
  | { code: "SIZE_TOO_LARGE"; sizeBytes: number; maxBytes: number }
  | { code: "SIZE_REQUIRED" };

export function isAllowedMime(mime: string): boolean {
  if (!mime || typeof mime !== "string") return false;
  return ALLOWED_MIME_PATTERNS.some((p) => p.test(mime.trim()));
}

export function validateUpload(input: { contentType: string; sizeBytes: number | null | undefined }): UploadValidationError | null {
  if (!isAllowedMime(input.contentType)) {
    return { code: "MIME_NOT_ALLOWED", mime: input.contentType };
  }
  // Size required at presign time — without it we can't bound the upload.
  if (input.sizeBytes == null) {
    return { code: "SIZE_REQUIRED" };
  }
  if (input.sizeBytes > MAX_UPLOAD_BYTES) {
    return { code: "SIZE_TOO_LARGE", sizeBytes: input.sizeBytes, maxBytes: MAX_UPLOAD_BYTES };
  }
  return null;
}
