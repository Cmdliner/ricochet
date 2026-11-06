import { LIMITS } from "@ricochet/shared";
import type { UploadRule } from "../media/media.service.js";

export const VOICE_RULE: UploadRule = {
  types: {
    "audio/mp4": "m4a",
    "audio/m4a": "m4a",
    "audio/x-m4a": "m4a",
    "audio/aac": "aac",
    "audio/mpeg": "mp3",
    "audio/webm": "webm",
  },
  maxBytes: LIMITS.voiceNoteMaxBytes,
};

export const VIDEO_RULE: UploadRule = {
  types: { "video/mp4": "mp4", "video/quicktime": "mov", "video/webm": "webm" },
  maxBytes: LIMITS.videoNoteMaxBytes,
};

/** Recordings are private, and are filed under the person who made them so only they can attach one to a message. */
export const mediaPrefix = (userId: string) => `private/media/${userId}/`;
