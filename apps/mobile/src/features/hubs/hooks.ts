import { useCallback, useEffect, useMemo, useRef } from "react";
import { realtime } from "@/lib/realtime";
import { formatDuration } from "./format";
import { useHubsStore } from "./store";
import { ME_ID, type Message, type Pod, type Role } from "./types";

export function useHubPods(hubId: string | undefined): Pod[] {
  const pods = useHubsStore((s) => s.pods);
  return useMemo(() => pods.filter((pod) => pod.hubId === hubId), [pods, hubId]);
}

export function useLastMessage(podId: string): Message | undefined {
  const messages = useHubsStore((s) => s.messages[podId]);
  return messages?.[messages.length - 1];
}

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

export function describeMessage(message: Message, authorName?: string): string {
  const prefix = authorName ? `${authorName}: ` : "";
  switch (message.kind) {
    case "text":
      return `${prefix}${message.text.replace(/\s+/g, " ")}`;
    case "voice":
      return `${prefix}Voice note${message.durationMs ? ` ${formatDuration(message.durationMs)}` : ""}`;
    case "video":
      return `${prefix}Video note${message.durationMs ? ` ${formatDuration(message.durationMs)}` : ""}`;
    case "system":
      return message.text;
  }
}

export function useMyRole(hubId: string | undefined): Role | undefined {
  return useHubsStore((s) => s.hubs.find((h) => h.id === hubId)?.members.find((m) => m.id === ME_ID)?.role);
}

export function usePodStats(podId: string | undefined) {
  const messages = useHubsStore((s) => s.messages[podId ?? ""]);
  return useMemo(() => {
    const list = messages ?? [];
    return {
      messages: list.filter((m) => m.kind === "text").length,
      voice: list.filter((m) => m.kind === "voice").length,
      video: list.filter((m) => m.kind === "video").length,
    };
  }, [messages]);
}

const TYPING_PING_MS = 2500;

/** Everything a pod or chat screen needs: its history, its live room, older pages, and the typing signal. */
export function useConversation(id: string | undefined) {
  const openConversation = useHubsStore((s) => s.openConversation);
  const closeConversation = useHubsStore((s) => s.closeConversation);
  const loadOlderMessages = useHubsStore((s) => s.loadOlder);
  const paging = useHubsStore((s) => s.paging[id ?? ""]);
  const lastPing = useRef(0);

  useEffect(() => {
    if (!id) return;
    void openConversation(id);
    return () => closeConversation(id);
  }, [id, openConversation, closeConversation]);

  const loadOlder = useCallback(() => {
    if (id) void loadOlderMessages(id);
  }, [id, loadOlderMessages]);

  /** Called as the person types. The server forgets a typing signal after a few seconds, so it is repeated while they keep going. */
  const signalTyping = useCallback(
    (typing: boolean) => {
      if (!id) return;
      if (!typing) {
        lastPing.current = 0;
        realtime.typing(id, false);
      } else if (Date.now() - lastPing.current > TYPING_PING_MS) {
        lastPing.current = Date.now();
        realtime.typing(id, true);
      }
    },
    [id],
  );

  return { loaded: !!paging?.loaded, hasOlder: !paging?.loaded || paging.cursor !== null, loadOlder, signalTyping };
}
