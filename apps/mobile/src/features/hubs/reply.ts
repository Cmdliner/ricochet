import { useEffect, type RefObject } from "react";
import type { FlatList } from "react-native";
import { create } from "zustand";
import type { ChatItem } from "./types";

type ReplyDraftState = {
  /** Per conversation, the message the next thing sent will answer. */
  targets: Record<string, string>;
  start: (conversationId: string, messageId: string) => void;
  clear: (conversationId: string) => void;
};

export const useReplyDraft = create<ReplyDraftState>((set) => ({
  targets: {},
  start: (conversationId, messageId) => set((state) => ({ targets: { ...state.targets, [conversationId]: messageId } })),
  clear: (conversationId) =>
    set((state) => {
      const { [conversationId]: _removed, ...rest } = state.targets;
      return { targets: rest };
    }),
}));

type JumpState = {
  /** `n` changes on every request, so asking for the same message twice scrolls twice. */
  request: { conversationId: string; messageId: string; n: number } | null;
  jumpTo: (conversationId: string, messageId: string) => void;
};

export const useJump = create<JumpState>((set, get) => ({
  request: null,
  jumpTo: (conversationId, messageId) => set({ request: { conversationId, messageId, n: (get().request?.n ?? 0) + 1 } }),
}));

type ListRef = RefObject<FlatList<ChatItem> | null>;

/**
 * Scrolls the open conversation to a message when its quote is tapped. A message that is not loaded yet
 * (older than the page on screen) is not in the list to scroll to, so the tap does nothing.
 */
export function useScrollToQuoted(conversationId: string | undefined, listRef: ListRef, items: ChatItem[]) {
  const request = useJump((s) => s.request);

  useEffect(() => {
    if (!request || request.conversationId !== conversationId) return;
    const index = items.findIndex((item) => item.id === request.messageId);
    if (index !== -1) listRef.current?.scrollToIndex({ index, viewPosition: 0.5, animated: true });
    // Only a new request should scroll, not every new message arriving in `items`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request]);
}

/** Rows have different heights, so a far-away index can be asked for before it has been measured. Scroll near it, then try again. */
export function retryScrollToIndex(listRef: ListRef) {
  return (info: { index: number; averageItemLength: number }) => {
    listRef.current?.scrollToOffset({ offset: info.index * info.averageItemLength, animated: true });
    setTimeout(() => listRef.current?.scrollToIndex({ index: info.index, viewPosition: 0.5, animated: true }), 250);
  };
}
