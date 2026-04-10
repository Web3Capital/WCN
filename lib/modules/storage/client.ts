import { S3Client } from "@aws-sdk/client-s3";

let _client: S3Client | null = null;

export function getStorageClient(): S3Client {
  if (_client) return _client;
  _client = new S3Client({
    region: process.env.S3_REGION ?? "auto",
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
    },
    forcePathStyle: true,
  });
  return _client;
}

export function getBucket(): string {
  return process.env.S3_BUCKET ?? "wcn-files";
}
