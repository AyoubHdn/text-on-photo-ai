import { HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { GenerationStorage, StorageObject } from "./types.ts";

export class S3GenerationStorage implements GenerationStorage {
  private readonly client: S3Client;
  constructor(private readonly bucket: string, private readonly region: string) {
    if (!bucket || !region) throw new Error("S3_CONFIGURATION_MISSING");
    this.client = new S3Client({ region });
  }

  publicUrl(key: string) { return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`; }

  async putObject(object: StorageObject): Promise<void> {
    try {
      await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: object.key }));
      throw new Error("S3_OBJECT_ALREADY_EXISTS");
    } catch (error) {
      const status = (error as { $metadata?: { httpStatusCode?: number }; name?: string }).$metadata?.httpStatusCode;
      const name = (error as { name?: string }).name;
      if (status !== 404 && name !== "NotFound" && name !== "NoSuchKey") throw error;
    }
    await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: object.key, Body: object.bytes, ContentType: object.contentType }));
  }
}
