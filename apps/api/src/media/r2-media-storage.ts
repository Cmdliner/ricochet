import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createWriteStream } from "node:fs";
import { readFile } from "node:fs/promises";
import type { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { PUBLIC_PREFIX, type MediaStorage, type StoredObject, type UploadTarget } from "./media-storage.js";

export type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  /** Holds `public/` keys. Has a public domain attached in Cloudflare. */
  publicBucket: string;
  /** Holds everything else. Never public, only reachable through links that expire. */
  privateBucket: string;
  publicBaseUrl: string;
};

/** Cloudflare R2 through its S3-compatible API. The phone uploads and downloads directly, so media never passes through this server. */
export class R2MediaStorage implements MediaStorage {
  private readonly client: S3Client;

  constructor(private readonly config: R2Config) {
    this.client = new S3Client({
      region: "auto",
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
    });
  }

  private bucketFor(key: string) {
    return key.startsWith(PUBLIC_PREFIX) ? this.config.publicBucket : this.config.privateBucket;
  }

  async createUpload({ key, contentType, expiresInSeconds }: Parameters<MediaStorage["createUpload"]>[0]): Promise<UploadTarget> {
    const url = await getSignedUrl(this.client, new PutObjectCommand({ Bucket: this.bucketFor(key), Key: key, ContentType: contentType }), {
      expiresIn: expiresInSeconds,
    });
    // A presigned PUT cannot cap the size, so the API checks it with `stat` after the upload and deletes anything too big.
    return { url, method: "PUT", headers: { "content-type": contentType } };
  }

  async stat(key: string): Promise<StoredObject | null> {
    try {
      const head = await this.client.send(new HeadObjectCommand({ Bucket: this.bucketFor(key), Key: key }));
      return { size: head.ContentLength ?? 0, contentType: head.ContentType ?? null };
    } catch (error) {
      if ((error as { name?: string }).name === "NotFound") return null;
      throw error;
    }
  }

  publicUrl(key: string): string {
    return `${this.config.publicBaseUrl.replace(/\/$/, "")}/${key}`;
  }

  createDownloadUrl(key: string, expiresInSeconds: number): Promise<string> {
    if (key.startsWith(PUBLIC_PREFIX)) return Promise.resolve(this.publicUrl(key));
    return getSignedUrl(this.client, new GetObjectCommand({ Bucket: this.bucketFor(key), Key: key }), { expiresIn: expiresInSeconds });
  }

  async download(key: string, destination: string): Promise<void> {
    const object = await this.client.send(new GetObjectCommand({ Bucket: this.bucketFor(key), Key: key }));
    await pipeline(object.Body as Readable, createWriteStream(destination));
  }

  async uploadFile(key: string, source: string, contentType: string): Promise<void> {
    await this.client.send(new PutObjectCommand({ Bucket: this.bucketFor(key), Key: key, Body: await readFile(source), ContentType: contentType }));
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucketFor(key), Key: key }));
  }
}
