import { useMemo } from "react";
import { formatDuration } from "./format";
import { useHubsStore } from "./store";
import type { Message, Pod } from "./types";

/** Pods of one hub, in the order they were defined. */
export function useHubPods(hubId: string | undefined): Pod[] {
  const pods = useHubsStore((s) => s.pods);
  return useMemo(() => pods.filter((pod) => pod.hubId === hubId), [pods, hubId]);
}

/** The newest message in a pod, if any. */
export function useLastMessage(podId: string): Message | undefined {
  const messages = useHubsStore((s) => s.messages[podId]);
  return messages?.[messages.length - 1];
}

/** Numbers shown on a hub row and on the hub screen. Muted pods do not add to the unread count. */
export function useHubStats(hubId: string) {
  const hub = useHubsStore((s) => s.hubs.find((h) => h.id === hubId));
  const pods = useHubPods(hubId);
  const unread = useHubsStore((s) => s.unread);
  const members = useHubsStore((s) => s.members);

  return useMemo(() => {
    const memberIds = hub?.members.map((m) => m.id) ?? [];
    return {
      podCount: pods.length,
      memberCount: memberIds.length,
      online: memberIds.filter((id) => members[id]?.online).length,
      unread: pods.reduce((sum, pod) => sum + (pod.muted ? 0 : (unread[pod.id] ?? 0)), 0),
    };
  }, [hub, pods, unread, members]);
}

/** One line that describes a message, for list rows. */
export function describeMessage(message: Message, authorName?: string): string {
  const prefix = authorName ? `${authorName}: ` : "";
  switch (message.kind) {
    case "text":
      return `${prefix}${message.text.replace(/\s+/g, " ")}`;
    case "voice":
      return `${prefix}Voice note ${formatDuration(message.durationMs)}`;
    case "video":
      return `${prefix}Video note ${formatDuration(message.durationMs)}`;
    case "system":
      return message.text;
  }
}
