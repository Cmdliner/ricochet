import type { MessageType } from "@ricochet/shared";
import { previewOf } from "../activity/mentions.js";

type Describe = {
  sender: string;
  type: MessageType;
  body: string | null;
  /** The pod's name, or null in a one-to-one chat. */
  pod: string | null;
  hub: string | null;
  mentioned: boolean;
};

/** What the lock screen shows. Pods lead with where it happened, chats with who wrote. */
export function describeMessagePush({ sender, type, body, pod, hub, mentioned }: Describe): { title: string; body: string } {
  const content = type === "voice" ? "Voice note" : type === "video" ? "Video note" : (previewOf(body) ?? "");
  if (!pod) return { title: sender, body: content };
  const title = hub ? `#${pod} · ${hub}` : `#${pod}`;
  return { title, body: mentioned ? `${sender} mentioned you: ${content}` : `${sender}: ${content}` };
}
