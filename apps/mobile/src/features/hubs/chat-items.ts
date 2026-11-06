import { formatDayLabel } from "./format";
import type { ChatItem, Message } from "./types";

const GROUP_WINDOW_MS = 5 * 60_000;

function authorOf(message: Message): string | null {
  return message.kind === "system" ? null : message.authorId;
}

function sameDay(a: number, b: number): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

// The result is newest first, the order an inverted chat list wants.
export function buildChatItems(messages: Message[], myId: string): ChatItem[] {
  const items: ChatItem[] = [];

  messages.forEach((message, index) => {
    const previous = messages[index - 1];
    const next = messages[index + 1];

    if (!previous || !sameDay(previous.sentAt, message.sentAt)) {
      items.push({ type: "day", id: `day-${message.id}`, label: formatDayLabel(message.sentAt) });
    }

    const author = authorOf(message);
    const continues = (other: Message | undefined) =>
      !!other &&
      author !== null &&
      authorOf(other) === author &&
      sameDay(other.sentAt, message.sentAt) &&
      Math.abs(message.sentAt - other.sentAt) < GROUP_WINDOW_MS;

    items.push({
      type: "message",
      id: message.id,
      message,
      mine: author === myId,
      startsGroup: !continues(previous),
      endsGroup: !continues(next),
    });
  });

  return items.reverse();
}
