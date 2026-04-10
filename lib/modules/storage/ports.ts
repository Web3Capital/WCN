/**
 * @wcn/storage — Port Definitions
 */

export interface StoragePort {
  generateUploadUrl(key: string, contentType: string, expiresIn: number): Promise<string>;
  generateDownloadUrl(key: string, expiresIn: number): Promise<string>;
  deleteObject(key: string): Promise<void>;
}
