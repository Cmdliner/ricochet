import { mediaUploadSchema, messageSchema, type MessageView } from "@ricochet/shared";
import { api } from "@/lib/api";
import { uploadTo } from "@/lib/media";

type Recording = {
  conversationId: string;
  clientId: string;
  kind: "voice" | "video";
  uri: string;
  durationMs: number;
  waveform?: number[];
};

const BY_EXTENSION: Record<string, string> = {
  m4a: "audio/mp4",
  aac: "audio/aac",
  mp3: "audio/mpeg",
  mp4: "video/mp4",
  mov: "video/quicktime",
};

/** A recording file does not always report its own type, so fall back on what the recorder is known to produce. */
function typeOf(kind: Recording["kind"], uri: string, reported: string): string {
  if (reported.startsWith(kind === "voice" ? "audio/" : "video/")) return reported;
  const extension = uri.split("?")[0]?.split(".").pop()?.toLowerCase() ?? "";
  return BY_EXTENSION[extension] ?? (kind === "voice" ? "audio/mp4" : "video/mp4");
}

/** The three steps of sending a recording: ask for an upload link, send the file straight to storage, then send the message that points at it. */
export async function sendRecording(recording: Recording): Promise<MessageView> {
  const file = await (await fetch(recording.uri)).blob();
  const { key, upload } = await api(`/conversations/${recording.conversationId}/media`, {
    method: "POST",
    auth: true,
    body: { kind: recording.kind, contentType: typeOf(recording.kind, recording.uri, file.type), sizeBytes: file.size },
    schema: mediaUploadSchema,
  });
  await uploadTo(upload, file);
  return api("/messages", {
    method: "POST",
    auth: true,
    body: {
      conversationId: recording.conversationId,
      clientId: recording.clientId,
      type: recording.kind,
      mediaKey: key,
      durationMs: recording.durationMs,
      waveform: recording.waveform,
    },
    schema: messageSchema,
  });
}

/** Only one recording plays at a time. Starting another stops whichever was playing. */
let stopCurrent: (() => void) | null = null;
export function claimPlayback(stop: () => void) {
  if (stopCurrent && stopCurrent !== stop) stopCurrent();
  stopCurrent = stop;
}
export function releasePlayback(stop: () => void) {
  if (stopCurrent === stop) stopCurrent = null;
}
