import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import Animated, { FadeInDown } from "react-native-reanimated";
import { View, type ViewStyle } from "react-native";
import { Text } from "@/components/ui/text";
import { Avatar } from "@/components/ui/avatar";
import { useTheme } from "@/theme/theme-provider";
import { formatClock } from "../format";
import { useHubsStore } from "../store";
import type { ChatItem } from "../types";
import { ReactionRow } from "./reaction-row";
import { VideoNoteCircle } from "./video-note-circle";
import { VoiceContent } from "./voice-content";

type MessageRow = Extract<ChatItem, { type: "message" }>;

const BIG = 20;
const SMALL = 6;

/** Corners follow the run of messages: inner corners tighten, the last bubble gets a tail. */
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

/** `direct` is a one-to-one chat: no avatar or name beside the bubbles, since it is obvious who is talking. */
export const MessageItem = memo(function MessageItem({ item, direct = false }: { item: MessageRow; direct?: boolean }) {
  const { colors } = useTheme();
  const { message, mine, startsGroup, endsGroup } = item;
  const author = useHubsStore((s) => (message.kind === "system" ? undefined : s.members[message.authorId]));

  if (message.kind === "system") {
    return (
      <View className="my-3 items-center px-6">
        <Text className="rounded-full bg-raised px-3 py-1 text-center text-xs text-muted">{message.text}</Text>
      </View>
    );
  }

  const isVideo = message.kind === "video";
  const shape = bubbleShape(item);
  const isNew = Date.now() - message.sentAt < 4000;

  return (
    <Animated.View entering={isNew ? FadeInDown.duration(260) : undefined}>
      <View className={`flex-row items-end gap-2 px-3 ${mine ? "justify-end" : ""} ${endsGroup ? "mb-3" : "mb-0.5"}`}>
        {/* People you are talking to show their picture beside the last message of a run. */}
        {!mine && !direct ? (
          <View className="w-8">
            {endsGroup && author ? <Avatar name={author.name} color={author.color} size={32} /> : null}
          </View>
        ) : null}

        <View className={`${direct ? "max-w-[82%]" : "max-w-[80%]"} ${mine ? "items-end" : "items-start"}`}>
          {!mine && !direct && startsGroup && author ? (
            <Text className="mb-1 ml-3 text-xs font-sans-semibold text-muted">{author.name}</Text>
          ) : null}

          {isVideo ? (
            <VideoNoteCircle durationMs={message.durationMs} fresh={!mine} />
          ) : (
            <View style={shape} className={`px-3.5 py-2.5 ${mine ? "bg-accent" : "bg-raised"}`}>
              {message.kind === "text" ? (
                <Text className={`text-[16px] leading-[22px] ${mine ? "text-accent-ink" : "text-ink"}`}>
                  {message.text}
                </Text>
              ) : (
                <VoiceContent durationMs={message.durationMs} waveform={message.waveform} mine={mine} />
              )}
            </View>
          )}

          <ReactionRow podId={message.podId} messageId={message.id} reactions={message.reactions} mine={mine} />

          {endsGroup ? (
            <View className={`mt-1 flex-row items-center gap-1 ${mine ? "mr-1" : direct ? "ml-1" : "ml-3"}`}>
              <Text className="text-[11px] text-muted">{formatClock(message.sentAt)}</Text>
              {mine ? <Ionicons name="checkmark-done" size={14} color={colors.accentText} /> : null}
            </View>
          ) : null}
        </View>
      </View>
    </Animated.View>
  );
});
