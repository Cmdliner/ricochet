import { router } from "expo-router";
import { View } from "react-native";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Text } from "@/components/ui/text";
import { pluralize } from "../format";
import { useHubStats } from "../hooks";
import type { Hub } from "../types";

/** One hub as its own card: icon, name, a line of numbers and the unread count. */
export function HubRow({ hub }: { hub: Hub }) {
  const stats = useHubStats(hub.id);

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${hub.name}, ${pluralize(stats.podCount, "pod")}, ${stats.unread} unread`}
      onPress={() => router.push(`/hub/${hub.id}`)}
      className="flex-row items-center gap-4 rounded-3xl bg-surface p-3.5"
    >
      <Avatar name={hub.name} color={hub.color} size={54} square />
      <View className="flex-1 gap-1">
        <Text className="text-[17px] font-sans-semibold text-ink" numberOfLines={1}>
          {hub.name}
        </Text>
        <View className="flex-row items-center gap-2">
          <Text className="text-[13px] text-muted" numberOfLines={1}>
            {pluralize(stats.podCount, "pod")}
          </Text>
          <View className="size-1 rounded-full bg-line" />
          <View className="flex-row items-center gap-1.5">
            <View className="size-2 rounded-full bg-online" />
            <Text className="text-[13px] text-muted">{stats.online} online</Text>
          </View>
        </View>
      </View>
      <Badge count={stats.unread} />
    </PressableScale>
  );
}
