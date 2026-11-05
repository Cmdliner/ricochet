import { router } from "expo-router";
import { useMemo } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SectionLabel } from "@/components/ui/section-label";
import { useHubsStore } from "../store";
import type { Pod } from "../types";

function JumpCard({ pod }: { pod: Pod }) {
  const hub = useHubsStore((s) => s.hubs.find((h) => h.id === pod.hubId));
  const unread = useHubsStore((s) => s.unread[pod.id] ?? 0);
  if (!hub) return null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${pod.name} in ${hub.name}`}
      onPress={() => router.push(`/pod/${pod.id}`)}
      className="w-44 gap-4 rounded-3xl border border-line bg-surface p-4 active:bg-raised"
    >
      <View className="flex-row items-center justify-between">
        <Avatar name={hub.name} color={hub.color} size={36} square />
        <Badge count={pod.muted ? 0 : unread} />
      </View>
      <View>
        <Text className="text-[16px] font-semibold text-ink" numberOfLines={1}>
          # {pod.name}
        </Text>
        <Text className="text-sm text-muted" numberOfLines={1}>
          {hub.name}
        </Text>
      </View>
    </Pressable>
  );
}

/** A row of the pods you were most recently active in, so the next tap is one away. */
export function JumpBackStrip() {
  const pods = useHubsStore((s) => s.pods);
  const messages = useHubsStore((s) => s.messages);

  const recent = useMemo(() => {
    const latest = (pod: Pod) => messages[pod.id]?.at(-1)?.sentAt ?? 0;
    return [...pods]
      .filter((pod) => latest(pod) > 0 && !pod.isPrivate)
      .sort((a, b) => latest(b) - latest(a))
      .slice(0, 6);
  }, [pods, messages]);

  if (recent.length === 0) return null;

  return (
    <View>
      <View className="px-4">
        <SectionLabel>Jump back in</SectionLabel>
      </View>
      <FlatList
        horizontal
        data={recent}
        keyExtractor={(pod) => pod.id}
        renderItem={({ item }) => <JumpCard pod={item} />}
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-3 px-4"
      />
    </View>
  );
}
