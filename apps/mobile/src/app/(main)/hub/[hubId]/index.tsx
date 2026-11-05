import { Ionicons } from "@expo/vector-icons";
import { colors as tokens } from "@ricochet/shared";
import { router, useLocalSearchParams } from "expo-router";
import { Fragment, useMemo } from "react";
import { ScrollView, Share, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar } from "@/components/ui/avatar";
import { IconButton } from "@/components/ui/icon-button";
import { NotFound } from "@/components/ui/not-found";
import { PressableScale } from "@/components/ui/pressable-scale";
import { SectionLabel } from "@/components/ui/section-label";
import { Text } from "@/components/ui/text";
import { PodRow } from "@/features/hubs/components/pod-row";
import { pluralize } from "@/features/hubs/format";
import { useHubPods, useHubStats } from "@/features/hubs/hooks";
import { useHub } from "@/features/hubs/store";
import type { Pod } from "@/features/hubs/types";
import { useTheme } from "@/theme/theme-provider";

export default function HubScreen() {
  const { colors } = useTheme();
  const { hubId } = useLocalSearchParams<{ hubId: string }>();
  const hub = useHub(hubId);
  const stats = useHubStats(hubId ?? "");
  const pods = useHubPods(hubId);

  // Pods grouped by category, keeping the order the categories first appear in.
  const groups = useMemo(() => {
    const map = new Map<string, Pod[]>();
    for (const pod of pods) map.set(pod.category, [...(map.get(pod.category) ?? []), pod]);
    return [...map.entries()];
  }, [pods]);

  if (!hub) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
        <NotFound what="Hub" />
      </SafeAreaView>
    );
  }

  const invite = () =>
    Share.share({
      message: `Join ${hub.name} on Ricochet with the code ${hub.inviteCode}. https://ricochet.app/i/${hub.inviteCode}`,
    });

  const tint = tokens.avatar[hub.color];

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      <View className="h-14 flex-row items-center justify-between px-3">
        <IconButton
          icon="chevron-back"
          label="Back"
          variant="plain"
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
        />
        <IconButton icon="share-outline" label="Share invite" variant="plain" onPress={invite} />
      </View>

      <ScrollView contentContainerClassName="pb-12" showsVerticalScrollIndicator={false}>
        {/* The hub's own colour behind its name, so every hub feels like a place of its own. */}
        <Animated.View entering={FadeInDown.duration(380)} style={{ marginHorizontal: 20 }}>
          <View style={{ backgroundColor: `${tint}2e` }} className="items-center gap-3 rounded-[32px] px-6 pt-8 pb-6">
            <Avatar name={hub.name} color={hub.color} size={84} square />
            <Text className="font-display text-[28px] tracking-tight text-ink" numberOfLines={2}>
              {hub.name}
            </Text>
            <Text className="text-center text-[15px] leading-[22px] text-muted">{hub.description}</Text>

            <View className="mt-1 flex-row items-center gap-3">
              <View className="flex-row items-center gap-1.5 rounded-full bg-canvas/60 px-3 py-1.5">
                <Ionicons name="people" size={14} color={colors.muted} />
                <Text className="text-[13px] font-sans-medium text-ink">{pluralize(stats.memberCount, "member")}</Text>
              </View>
              <View className="flex-row items-center gap-1.5 rounded-full bg-canvas/60 px-3 py-1.5">
                <View className="size-2 rounded-full bg-online" />
                <Text className="text-[13px] font-sans-medium text-ink">{stats.online} online</Text>
              </View>
            </View>

            <View className="mt-3 w-full flex-row gap-3">
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Invite people"
                onPress={invite}
                containerStyle={{ flex: 1 }}
                className="h-12 w-full flex-row items-center justify-center gap-2 rounded-full bg-accent"
              >
                <Ionicons name="person-add" size={17} color={colors.accentInk} />
                <Text className="text-[15px] font-sans-semibold text-accent-ink">Invite</Text>
              </PressableScale>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="See members"
                onPress={() => router.push(`/hub/${hub.id}/members`)}
                containerStyle={{ flex: 1 }}
                className="h-12 w-full flex-row items-center justify-center gap-2 rounded-full bg-canvas/70"
              >
                <Ionicons name="people" size={17} color={colors.ink} />
                <Text className="text-[15px] font-sans-semibold text-ink">Members</Text>
              </PressableScale>
            </View>
          </View>
        </Animated.View>

        {groups.map(([category, categoryPods], groupIndex) => (
          <Animated.View key={category} entering={FadeInDown.delay(120 + groupIndex * 90).duration(380)}>
            <View className="px-5">
              <SectionLabel>{category}</SectionLabel>
              <View className="overflow-hidden rounded-3xl bg-surface">
                {categoryPods.map((pod, index) => (
                  <Fragment key={pod.id}>
                    {index > 0 ? <View className="ml-[72px] h-px bg-line/70" /> : null}
                    <PodRow pod={pod} />
                  </Fragment>
                ))}
              </View>
            </View>
          </Animated.View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
