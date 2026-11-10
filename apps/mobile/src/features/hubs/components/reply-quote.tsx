import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";
import { useTheme } from "@/theme/theme-provider";
import { useJump } from "../reply";
import { ME_ID, type ReplyRef } from "../types";

/** What stands in for the text when the quoted message was a recording. */
export function quoteLabel(reply: ReplyRef): string {
  if (reply.kind === "text") return reply.text ?? "";
  return reply.kind === "voice" ? "Voice note" : "Video note";
}

export const quoteAuthor = (reply: ReplyRef) => (reply.authorId === ME_ID ? "You" : reply.authorName);

/**
 * The quoted message above a reply. `onBubble` is for a quote drawn inside a bubble, where it picks up the bubble's colours.
 * Tapping it scrolls to the original, when that message is on screen.
 */
export function ReplyQuote({ reply, podId, bubble }: { reply: ReplyRef; podId: string; bubble: "mine" | "theirs" | "none" }) {
  const { colors } = useTheme();
  const mine = bubble === "mine";
  const icon = reply.kind === "voice" ? "mic" : reply.kind === "video" ? "videocam" : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`In reply to ${quoteAuthor(reply)}: ${quoteLabel(reply)}. Tap to see the message`}
      onPress={() => {
        void Haptics.selectionAsync().catch(() => undefined);
        useJump.getState().jumpTo(podId, reply.id);
      }}
      className={`mb-1.5 flex-row overflow-hidden rounded-xl ${mine ? "bg-accent-ink/15" : bubble === "theirs" ? "bg-canvas/60" : "bg-raised"}`}
    >
      <View className={`w-1 ${mine ? "bg-accent-ink/60" : "bg-accent"}`} />
      <View className="shrink px-2.5 py-1.5">
        <Text className={`text-xs font-sans-semibold ${mine ? "text-accent-ink" : "text-ink"}`} numberOfLines={1}>
          {quoteAuthor(reply)}
        </Text>
        <View className="flex-row items-center gap-1">
          {icon ? <Ionicons name={icon} size={12} color={mine ? colors.accentInk : colors.muted} /> : null}
          <Text className={`shrink text-[13px] ${mine ? "text-accent-ink/80" : "text-muted"}`} numberOfLines={2}>
            {quoteLabel(reply)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
