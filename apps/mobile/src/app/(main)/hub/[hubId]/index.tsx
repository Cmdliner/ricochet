import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Fragment, useMemo } from "react";
import { Pressable, ScrollView, Share, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar } from "@/components/ui/avatar";
import { IconButton } from "@/components/ui/icon-button";
import { NotFound } from "@/components/ui/not-found";
import { ScreenHeader } from "@/components/ui/screen-header";
import { SectionLabel } from "@/components/ui/section-label";
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
    Share.share({ message: `Join ${hub.name} on Ricochet with the code ${hub.inviteCode}. https://ricochet.app/i/${hub.inviteCode}` });

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      <ScreenHeader
        title={hub.name}
        subtitle={`${pluralize(stats.memberCount, "member")} · ${stats.online} online`}
        leading={<Avatar name={hub.name} color={hub.color} size={36} square />}
        actions={
          <>
            <IconButton icon="person-add-outline" label="Invite people" variant="plain" onPress={invite} />
            <IconButton
              icon="people-outline"
              label="See members"
              variant="plain"
              onPress={() => router.push(`/hub/${hub.id}/members`)}
            />
          </>
        }
      />

      <ScrollView contentContainerClassName="pb-10" showsVerticalScrollIndicator={false}>
        <View className="mx-4 mt-5 gap-4 rounded-3xl border border-line bg-surface p-5">
          <Text className="text-base leading-6 text-ink">{hub.description}</Text>
          <View className="flex-row items-center justify-between rounded-2xl bg-raised px-4 py-3">
            <View>
              <Text className="text-xs font-medium tracking-wider text-muted uppercase">Invite code</Text>
              <Text className="mt-0.5 text-lg font-bold tracking-[3px] text-ink">{hub.inviteCode}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Share invite"
              onPress={invite}
              className="h-10 flex-row items-center gap-2 rounded-full bg-accent px-4 active:opacity-80"
            >
              <Ionicons name="share-outline" size={18} color={colors.accentInk} />
              <Text className="text-sm font-semibold text-accent-ink">Share</Text>
            </Pressable>
          </View>
        </View>

        {groups.map(([category, categoryPods]) => (
          <View key={category} className="px-4">
            <SectionLabel>{category}</SectionLabel>
            <View className="overflow-hidden rounded-3xl border border-line bg-surface">
              {categoryPods.map((pod, index) => (
                <Fragment key={pod.id}>
                  {index > 0 ? <View className="ml-[68px] h-px bg-line" /> : null}
                  <PodRow pod={pod} />
                </Fragment>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
