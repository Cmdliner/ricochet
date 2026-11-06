/**
 * Everything the app needs from file storage, and nothing provider specific. Cloudflare R2 and the local disk
 * implement it today; another provider only has to implement these five methods.
 *
 * Keys under `public/` are meant to be shown to anyone (avatars). Every other key is private and is only ever
 * handed out as a link that expires.
 */
export type UploadTarget = {
  /** Absolute, or a path on this API when the provider stores files itself. The app resolves a path against its API address. */
  url: string;
  method: "PUT";
  headers: Record<string, string>;
};

export type StoredObject = { size: number; contentType: string | null };

export interface MediaStorage {
  createUpload(input: { key: string; contentType: string; maxBytes: number; expiresInSeconds: number }): Promise<UploadTarget>;
  /** What was actually uploaded, or null when nothing is there. Uploads go straight from the phone, so this is how the API checks them. */
  stat(key: string): Promise<StoredObject | null>;
  /** A permanent address for a `public/` key. */
  publicUrl(key: string): string;
  createDownloadUrl(key: string, expiresInSeconds: number): Promise<string>;
  delete(key: string): Promise<void>;
  /** Copies an object to a file on this machine, for the worker that processes media with ffmpeg. */
  download(key: string, destination: string): Promise<void>;
  /** Stores a file from this machine, for things the server makes itself such as a video's poster frame. */
  uploadFile(key: string, source: string, contentType: string): Promise<void>;
}

export const MEDIA_STORAGE = Symbol("MEDIA_STORAGE");

export const PUBLIC_PREFIX = "public/";

const SAFE_KEY = /^[a-z0-9][a-z0-9/_.-]*$/;

/** Keys become file paths on the local provider, so anything that could climb out of the folder is refused. */
export function isSafeKey(key: string): boolean {
  return key.length <= 200 && SAFE_KEY.test(key) && !key.split("/").some((part) => part === ".." || part === "." || part === "");
}

/** Reads a `Range: bytes=a-b` header. Returns null when there is none, and "invalid" when it cannot be satisfied. */
export function parseRange(header: string | undefined, size: number): { start: number; end: number } | "invalid" | null {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match || (match[1] === "" && match[2] === "")) return "invalid";
  let start: number;
  let end: number;
  if (match[1] === "") {
    const suffix = Number(match[2]);
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] === "" ? size - 1 : Math.min(Number(match[2]), size - 1);
  }
  return start > end || start >= size ? "invalid" : { start, end };
}
