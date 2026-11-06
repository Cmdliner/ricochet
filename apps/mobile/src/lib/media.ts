import type { UploadTarget } from "@ricochet/shared";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";
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

/**
 * How big a file on this phone is. Throws when it cannot be read, so that a failed read can never be uploaded
 * in the recording's place. (Reading a recording with `fetch(uri)` once returned the text "File not found",
 * which was then uploaded as if it were the recording.)
 */
export async function localFileSize(uri: string): Promise<number> {
  if (Platform.OS === "web") return (await (await fetch(uri)).blob()).size;
  const info = await FileSystem.getInfoAsync(uri);
  const size = info.exists ? info.size : 0;
  if (size === 0) throw new Error("The recording could not be read from this phone. Please try again.");
  return size;
}

/** Sends a file on this phone to storage with the link the API gave out, straight from disk. */
export async function uploadLocalFile(target: UploadTarget, uri: string): Promise<void> {
  if (Platform.OS === "web") return uploadTo(target, await (await fetch(uri)).blob());
  const url = mediaUrl(target.url);
  if (!url) throw new Error("Missing upload address.");
  let status: number;
  try {
    ({ status } = await FileSystem.uploadAsync(url, uri, {
      httpMethod: target.method,
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      headers: target.headers,
    }));
  } catch {
    throw new Error("Could not upload the file. Check your connection and try again.");
  }
  if (status < 200 || status >= 300) throw new Error("The upload was refused. Try again.");
}
