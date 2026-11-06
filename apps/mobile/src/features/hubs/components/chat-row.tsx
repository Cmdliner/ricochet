import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { View } from "react-native";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Text } from "@/components/ui/text";
import { useTheme } from "@/theme/theme-provider";
import { formatListTime } from "../format";
import { useLastMessage } from "../hooks";
import { useHubsStore } from "../store";
import { ME_ID, type Chat, type Message } from "../types";

function Preview({ message, hasUnread }: { message: Message | undefined; hasUnread: boolean }) {
  const { colors } = useTheme();
  if (!message) return <Text className="text-sm text-muted">Say hello</Text>;
  if (message.kind === "system") return <Text className="text-sm text-muted" numberOfLines={1}>{message.text}</Text>;

  const mine = message.authorId === ME_ID;
  const tone = hasUnread ? "text-ink" : "text-muted";
  const icon = message.kind === "voice" ? "mic" : message.kind === "video" ? "videocam" : null;
  const label =
    message.kind === "text" ? message.text.replace(/\s+/g, " ") : message.kind === "voice" ? "Voice note" : "Video note";

  return (
    <View className="flex-row items-center gap-1">
      {mine ? <Ionicons name="checkmark-done" size={15} color={colors.accentText} /> : null}
      {icon ? <Ionicons name={icon} size={14} color={colors.muted} /> : null}
      <Text className={`flex-1 text-[15px] ${tone}`} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export function ChatRow({ chat }: { chat: Chat }) {
  const { colors } = useTheme();
  const person = useHubsStore((s) => s.members[chat.personId]);
  const last = useLastMessage(chat.id);
  const unread = useHubsStore((s) => s.unread[chat.id] ?? 0);
  const typing = useHubsStore((s) => s.typing[chat.id] === chat.personId);
  if (!person) return null;
  const hasUnread = unread > 0 && !chat.muted;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${person.name}${hasUnread ? `, ${unread} unread` : ""}${person.online ? ", online" : ""}`}
      scaleTo={0.985}
      onPress={() => router.push({ pathname: "/chat/[chatId]", params: { chatId: chat.id } })}
      className="flex-row items-center gap-3.5 rounded-3xl px-3 py-3"
    >
      <View>
        <Avatar name={person.name} color={person.color} size={56} />
        {person.online ? (
          <View className="absolute right-0 bottom-0 size-4 rounded-full border-[3px] border-canvas bg-online" />
        ) : null}
      </View>

      <View className="flex-1 gap-1">
        <View className="flex-row items-center gap-1.5">
          <Text className={`shrink text-[17px] text-ink ${hasUnread ? "font-sans-bold" : "font-sans-semibold"}`} numberOfLines={1}>
            {person.name}
          </Text>
          {chat.muted ? <Ionicons name="notifications-off-outline" size={14} color={colors.muted} /> : null}
        </View>
        {typing ? <Text className="text-[15px] font-sans-medium text-accent-text">typing…</Text> : <Preview message={last} hasUnread={hasUnread} />}
      </View>

      <View className="items-end gap-1.5">
        {last ? <Text className={`text-xs ${hasUnread ? "font-sans-semibold text-accent-text" : "text-muted"}`}>{formatListTime(last.sentAt)}</Text> : null}
        {chat.muted && unread > 0 ? <View className="size-2.5 rounded-full bg-muted" /> : <Badge count={unread} />}
      </View>
    </PressableScale>
  );
}
