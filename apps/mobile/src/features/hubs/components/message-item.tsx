import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { memo } from "react";
import { Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { View, type ViewStyle } from "react-native";
import { Text } from "@/components/ui/text";
import { Avatar } from "@/components/ui/avatar";
import { useTheme } from "@/theme/theme-provider";
import { formatClock } from "../format";
import { useMessageMenu } from "../message-menu";
import { useHubsStore } from "../store";
import type { ChatItem } from "../types";
import { MessageText } from "./message-text";
import { ReactionRow } from "./reaction-row";
import { ReplyQuote } from "./reply-quote";
import { VideoNoteCircle } from "./video-note-circle";
import { VoiceContent } from "./voice-content";

type MessageRow = Extract<ChatItem, { type: "message" }>;

const BIG = 20;
const SMALL = 6;

function bubbleShape({
  mine,
  startsGroup,
  endsGroup,
}: Pick<MessageRow, "mine" | "startsGroup" | "endsGroup">): ViewStyle {
  const inner = mine ? "Right" : "Left";
  return {
    borderRadius: BIG,
    [`borderTop${inner}Radius`]: startsGroup ? BIG : SMALL,
    [`borderBottom${inner}Radius`]: endsGroup ? SMALL : SMALL,
  } as ViewStyle;
}

export const MessageItem = memo(function MessageItem({ item, direct = false }: { item: MessageRow; direct?: boolean }) {
  const { colors } = useTheme();
  const { message, mine, startsGroup, endsGroup } = item;
  const author = useHubsStore((s) => (message.kind === "system" ? undefined : s.members[message.authorId]));
  const retryMessage = useHubsStore((s) => s.retryMessage);

  if (message.kind === "system") {
    return (
      <View className="my-3 items-center px-6">
        <Text className="rounded-full bg-raised px-3 py-1 text-center text-xs text-muted">{message.text}</Text>
      </View>
    );
  }

  const isVideo = message.kind === "video";
  // Holding a saved message opens reactions and Copy. A message still sending has nothing to react to yet.
  const openMenu = () => {
    if (message.status) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    useMessageMenu.getState().open(message.podId, message.id);
  };
  const shape = bubbleShape(item);
  const isNew = Date.now() - message.sentAt < 4000;

  return (
    <Animated.View entering={isNew ? FadeInDown.duration(260) : undefined}>
      <View className={`flex-row items-end gap-2 px-3 ${mine ? "justify-end" : ""} ${endsGroup ? "mb-3" : "mb-0.5"}`}>
        {!mine && !direct ? (
          <View className="w-8">
            {endsGroup && author ? <Avatar name={author.name} color={author.color} uri={author.avatarUrl} size={32} /> : null}
          </View>
        ) : null}

        <View className={`${direct ? "max-w-[82%]" : "max-w-[80%]"} ${mine ? "items-end" : "items-start"}`}>
          {!mine && !direct && startsGroup && author ? (
            <Text className="mb-1 ml-3 text-xs font-sans-semibold text-muted">{author.name}</Text>
          ) : null}

          {isVideo && message.reply ? <ReplyQuote reply={message.reply} podId={message.podId} bubble="none" /> : null}
          {isVideo ? (
            <VideoNoteCircle message={message} fresh={!mine} onLongPress={openMenu} />
          ) : (
            <Pressable
              accessibilityHint={message.status ? undefined : "Hold to react or reply"}
              onLongPress={openMenu}
              delayLongPress={350}
              style={shape}
              className={`px-3.5 py-2.5 ${mine ? "bg-accent" : "bg-raised"}`}
            >
              {message.reply ? <ReplyQuote reply={message.reply} podId={message.podId} bubble={mine ? "mine" : "theirs"} /> : null}
              {message.kind === "text" ? (
                <MessageText text={message.text} mine={mine} className={`text-[16px] leading-[22px] ${mine ? "text-accent-ink" : "text-ink"}`} />
              ) : (
                <VoiceContent message={message} mine={mine} onLongPress={openMenu} />
              )}
            </Pressable>
          )}

          <ReactionRow podId={message.podId} messageId={message.id} reactions={message.reactions} mine={mine} />

          {endsGroup || message.status === "failed" ? (
            <View className={`mt-1 flex-row items-center gap-1 ${mine ? "mr-1" : direct ? "ml-1" : "ml-3"}`}>
              <Text className="text-[11px] text-muted">{formatClock(message.sentAt)}</Text>
              {mine && message.status === "sending" ? <Ionicons name="time-outline" size={14} color={colors.muted} /> : null}
              {mine && message.status === "failed" ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Message not sent. Tap to try again"
                  hitSlop={8}
                  onPress={() => message.clientId && retryMessage(message.podId, message.clientId)}
                  className="flex-row items-center gap-1"
                >
                  <Ionicons name="alert-circle" size={14} color={colors.danger} />
                  <Text className="text-[11px] font-sans-semibold text-danger">Not sent. Tap to retry</Text>
                </Pressable>
              ) : null}
              {mine && !message.status ? <Ionicons name="checkmark-done" size={14} color={colors.accentText} /> : null}
            </View>
          ) : null}
        </View>
      </View>
    </Animated.View>
  );
});
