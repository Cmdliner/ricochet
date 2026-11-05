import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/theme/theme-provider";
import { formatListTime } from "../format";
import { describeMessage, useLastMessage } from "../hooks";
import { useHubsStore } from "../store";
import type { Pod } from "../types";

export function PodRow({ pod }: { pod: Pod }) {
  const { colors } = useTheme();
  const last = useLastMessage(pod.id);
  const unread = useHubsStore((s) => s.unread[pod.id] ?? 0);
  const author = useHubsStore((s) =>
    last && last.kind !== "system" ? s.members[last.authorId]?.name.split(" ")[0] : undefined,
  );
  const hasUnread = unread > 0 && !pod.muted;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${pod.name}${pod.muted ? ", muted" : ""}${hasUnread ? `, ${unread} unread` : ""}`}
      onPress={() => router.push(`/pod/${pod.id}`)}
      className="flex-row items-center gap-3 px-4 py-3.5 active:bg-raised"
    >
      <View className="size-11 items-center justify-center rounded-2xl bg-raised">
        {pod.isPrivate ? (
          <Ionicons name="lock-closed" size={18} color={colors.muted} />
        ) : (
          <Text className="text-xl font-semibold text-muted">#</Text>
        )}
      </View>

      <View className="flex-1 gap-0.5">
        <View className="flex-row items-center gap-1.5">
          <Text className={`shrink text-[16px] text-ink ${hasUnread ? "font-bold" : "font-semibold"}`} numberOfLines={1}>
            {pod.name}
          </Text>
          {pod.muted ? <Ionicons name="notifications-off-outline" size={14} color={colors.muted} /> : null}
        </View>
        <Text className={`text-sm ${hasUnread ? "text-ink" : "text-muted"}`} numberOfLines={1}>
          {last ? describeMessage(last, author) : pod.description}
        </Text>
      </View>

      <View className="items-end gap-1.5">
        {last ? <Text className="text-xs text-muted">{formatListTime(last.sentAt)}</Text> : null}
        {pod.muted && unread > 0 ? <View className="size-2 rounded-full bg-muted" /> : <Badge count={unread} />}
      </View>
    </Pressable>
  );
}
