import type { UploadTarget } from "@ricochet/shared";
import { API_URL } from "./config";

/** Storage hands back a full address, except in development where the API serves files itself and returns a path on its own address. */
export function mediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return /^https?:\/\//.test(url) ? url : `${API_URL}${url}`;
}

/** Sends a file straight to storage with the link the API gave out. The API never sees the bytes. */
export async function uploadTo(target: UploadTarget, file: Blob): Promise<void> {
  const url = mediaUrl(target.url);
  if (!url) throw new Error("Missing upload address.");
  let response: Response;
  try {
    response = await fetch(url, { method: target.method, headers: target.headers, body: file });
  } catch {
    throw new Error("Could not upload the file. Check your connection and try again.");
  }
  if (!response.ok) throw new Error("The upload was refused. Try a different file.");
}
