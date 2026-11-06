import type { ReactionView } from "@ricochet/shared";

type ReactionRow = { messageId: string; userId: string; emoji: string };

export function groupReactions(rows: ReactionRow[]): Map<string, ReactionView[]> {
  const byMessage = new Map<string, Map<string, string[]>>();
  for (const { messageId, userId, emoji } of rows) {
    const emojis = byMessage.get(messageId) ?? new Map<string, string[]>();
    emojis.set(emoji, [...(emojis.get(emoji) ?? []), userId]);
    byMessage.set(messageId, emojis);
  }

  const grouped = new Map<string, ReactionView[]>();
  for (const [messageId, emojis] of byMessage) {
    grouped.set(
      messageId,
      [...emojis].map(([emoji, userIds]) => ({ emoji, userIds })).sort((a, b) => a.emoji.localeCompare(b.emoji)),
    );
  }
  return grouped;
}
