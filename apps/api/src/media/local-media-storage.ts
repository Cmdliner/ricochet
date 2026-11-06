import { copyFile, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { sign } from "./media-signature.js";
import { isSafeKey, PUBLIC_PREFIX, type MediaStorage, type StoredObject, type UploadTarget } from "./media-storage.js";

/** Files on this server's disk, served by this API. For development, so nobody needs a Cloudflare account to run the app. */
export class LocalMediaStorage implements MediaStorage {
  private readonly root: string;

  constructor(
    directory: string,
    private readonly secret: string,
  ) {
    this.root = resolve(directory);
  }

  /** Where a key lives on disk. Throws for a key that is not safe, so a path can never escape the media folder. */
  pathFor(key: string): string {
    if (!isSafeKey(key)) throw new Error(`Unsafe media key: ${key}`);
    const path = resolve(this.root, key);
    if (!path.startsWith(this.root + sep)) throw new Error(`Unsafe media key: ${key}`);
    return path;
  }

  async createUpload({ key, contentType, maxBytes, expiresInSeconds }: Parameters<MediaStorage["createUpload"]>[0]): Promise<UploadTarget> {
    const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const signature = sign({ action: "upload", key, exp, contentType, maxBytes }, this.secret);
    const query = new URLSearchParams({ key, exp: String(exp), ct: contentType, max: String(maxBytes), sig: signature });
    return { url: `/media/local/upload?${query}`, method: "PUT", headers: { "content-type": contentType } };
  }

  /** Called by the upload route once the bytes are in, so `stat` can later report the type the phone declared. */
  async saveMeta(key: string, contentType: string): Promise<void> {
    await writeFile(`${this.pathFor(key)}.meta`, JSON.stringify({ contentType }));
  }

  async prepare(key: string): Promise<string> {
    const path = this.pathFor(key);
    await mkdir(dirname(path), { recursive: true });
    return path;
  }

  async stat(key: string): Promise<StoredObject | null> {
    try {
      const path = this.pathFor(key);
      const info = await stat(path);
      const meta = await readFile(`${path}.meta`, "utf8").catch(() => "{}");
      const parsed = JSON.parse(meta) as { contentType?: string };
      return { size: info.size, contentType: parsed.contentType ?? null };
    } catch {
      return null;
    }
  }

  publicUrl(key: string): string {
    return `/media/local/files/${key}`;
  }

  async createDownloadUrl(key: string, expiresInSeconds: number): Promise<string> {
    if (key.startsWith(PUBLIC_PREFIX)) return this.publicUrl(key);
    const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const query = new URLSearchParams({ exp: String(exp), sig: sign({ action: "download", key, exp }, this.secret) });
    return `/media/local/files/${key}?${query}`;
  }

  async download(key: string, destination: string): Promise<void> {
    await copyFile(this.pathFor(key), destination);
  }

  async uploadFile(key: string, source: string, contentType: string): Promise<void> {
    const path = await this.prepare(key);
    await copyFile(source, path);
    await this.saveMeta(key, contentType);
  }

  async delete(key: string): Promise<void> {
    const path = this.pathFor(key);
    await rm(path, { force: true });
    await rm(`${path}.meta`, { force: true });
  }
}
