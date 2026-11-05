import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { pluralize } from "../format";
import { useHubStats } from "../hooks";
import type { Hub } from "../types";

export function HubRow({ hub }: { hub: Hub }) {
  const stats = useHubStats(hub.id);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${hub.name}, ${pluralize(stats.podCount, "pod")}, ${stats.unread} unread`}
      onPress={() => router.push(`/hub/${hub.id}`)}
      className="flex-row items-center gap-4 rounded-3xl px-3 py-3 active:bg-raised"
    >
      <Avatar name={hub.name} color={hub.color} size={56} square />
      <View className="flex-1 gap-0.5">
        <Text className="text-[17px] font-semibold text-ink" numberOfLines={1}>
          {hub.name}
        </Text>
        <View className="flex-row items-center gap-2">
          <Text className="text-sm text-muted" numberOfLines={1}>
            {pluralize(stats.podCount, "pod")}
          </Text>
          <View className="size-1 rounded-full bg-line" />
          <View className="flex-row items-center gap-1.5">
            <View className="size-2 rounded-full bg-online" />
            <Text className="text-sm text-muted">{stats.online} online</Text>
          </View>
        </View>
      </View>
      <Badge count={stats.unread} />
    </Pressable>
  );
}
