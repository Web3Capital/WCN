import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getStorageClient, getBucket } from "./client";
import crypto from "crypto";

export async function generatePresignedUpload(
  key: string,
  contentType: string,
  expiresIn = 3600,
): Promise<{ url: string; key: string; expiresIn: number }> {
  const client = getStorageClient();
  const command = new PutObjectCommand({
    Bucket: getBucket(),
    Key: key,
    ContentType: contentType,
  });
  const url = await getSignedUrl(client, command, { expiresIn });
  return { url, key, expiresIn };
}

export async function generatePresignedDownload(
  key: string,
  expiresIn = 3600,
): Promise<string> {
  const client = getStorageClient();
  const command = new GetObjectCommand({
    Bucket: getBucket(),
    Key: key,
  });
  return getSignedUrl(client, command, { expiresIn });
}

export async function deleteObject(key: string): Promise<void> {
  const client = getStorageClient();
  await client.send(
    new DeleteObjectCommand({ Bucket: getBucket(), Key: key }),
  );
}

export function buildStorageKey(
  entityType: string,
  entityId: string,
  filename: string,
): string {
  const rand = crypto.randomBytes(8).toString("hex");
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${entityType}/${entityId}/${rand}/${safe}`;
}
