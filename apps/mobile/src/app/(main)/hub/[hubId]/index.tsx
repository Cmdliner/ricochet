import { Ionicons } from "@expo/vector-icons";
import { colors as tokens } from "@ricochet/shared";
import { router, useLocalSearchParams } from "expo-router";
import { Fragment, useMemo } from "react";
import { Alert, ScrollView, Share, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { PodsArt } from "@/components/illustrations/empty-art";
import { IconButton } from "@/components/ui/icon-button";
import { NotFound } from "@/components/ui/not-found";
import { PressableScale } from "@/components/ui/pressable-scale";
import { SectionLabel } from "@/components/ui/section-label";
import { SettingGroup, SettingRow } from "@/components/ui/setting-row";
import { Text } from "@/components/ui/text";
import { PodRow } from "@/features/hubs/components/pod-row";
import { pluralize } from "@/features/hubs/format";
import { useHubPods, useHubStats, useMyRole } from "@/features/hubs/hooks";
import { useHub, useHubsStore } from "@/features/hubs/store";
import { ME_ID, type Pod } from "@/features/hubs/types";
import { useTheme } from "@/theme/theme-provider";

const ROLE_LINE = { owner: "You are the owner", admin: "You are an admin", member: "You are a member" } as const;

export default function HubScreen() {
  const { colors } = useTheme();
  const { hubId } = useLocalSearchParams<{ hubId: string }>();
  const hub = useHub(hubId);
  const stats = useHubStats(hubId ?? "");
  const pods = useHubPods(hubId);
  const role = useMyRole(hubId);
  const people = useHubsStore((s) => s.members);
  const leaveHub = useHubsStore((s) => s.leaveHub);

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

  function confirmLeave() {
    if (!hub) return;
    Alert.alert(`Leave ${hub.name}?`, "You will lose access to its pods. You can join again with an invite code.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave hub",
        style: "destructive",
        onPress: () => {
          router.replace("/");
          leaveHub(hub.id);
        },
      },
    ]);
  }

  const canManage = role === "owner" || role === "admin";
  const tint = tokens.avatar[hub.color];
  // The first few faces, with the owner and admins leading, so the hub looks lived in.
  const faces = hub.members
    .filter((m) => m.id !== ME_ID)
    .map((m) => people[m.id])
    .filter((m): m is NonNullable<typeof m> => !!m)
    .slice(0, 5);
  const extra = Math.max(0, stats.memberCount - 1 - faces.length);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      <View className="h-14 flex-row items-center justify-between px-3">
        <IconButton
          icon="chevron-back"
          label="Back"
          variant="plain"
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
        />
        <View className="flex-row items-center">
          <IconButton icon="share-outline" label="Share invite" variant="plain" onPress={invite} />
          {canManage ? (
            <IconButton
              icon="settings-outline"
              label="Hub settings"
              variant="plain"
              onPress={() => router.push({ pathname: "/hub/[hubId]/settings", params: { hubId: hub.id } })}
            />
          ) : null}
        </View>
      </View>

      <ScrollView contentContainerClassName="pb-12" showsVerticalScrollIndicator={false}>
        {/* The hub's own colour behind its name, so every hub feels like a place of its own. */}
        <Animated.View entering={FadeInDown.duration(380)} style={{ marginHorizontal: 20 }}>
          <View style={{ backgroundColor: `${tint}2e` }} className="items-center gap-3 rounded-[32px] px-6 pt-8 pb-6">
            <Avatar name={hub.name} color={hub.color} size={84} square />
            <View className="items-center gap-2">
              <Text className="text-center font-display text-[28px] tracking-tight text-ink" numberOfLines={2}>
                {hub.name}
              </Text>
              {role ? (
                <View className="flex-row items-center gap-1.5 rounded-full bg-canvas/60 px-3 py-1">
                  <Ionicons name={role === "member" ? "person" : "shield-checkmark"} size={12} color={colors.accent} />
                  <Text className="text-xs font-sans-semibold text-ink">{ROLE_LINE[role]}</Text>
                </View>
              ) : null}
            </View>
            <Text className="text-center text-[15px] leading-[22px] text-muted">{hub.description}</Text>

            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={`${pluralize(stats.memberCount, "member")}, ${stats.online} online. See members`}
              onPress={() => router.push(`/hub/${hub.id}/members`)}
              className="mt-1 flex-row items-center gap-3 rounded-full bg-canvas/60 py-2 pr-4 pl-2.5"
            >
              <View className="flex-row">
                {faces.map((person, index) => (
                  <View key={person.id} style={{ marginLeft: index === 0 ? 0 : -10 }} className="rounded-full border-2 border-canvas">
                    <Avatar name={person.name} color={person.color} size={28} />
                  </View>
                ))}
              </View>
              <Text className="text-[13px] font-sans-medium text-ink">
                {extra > 0 ? `+${extra} · ` : ""}
                {pluralize(stats.memberCount, "member")}
              </Text>
              <View className="flex-row items-center gap-1.5">
                <View className="size-2 rounded-full bg-online" />
                <Text className="text-[13px] text-muted">{stats.online}</Text>
              </View>
            </PressableScale>

            <View className="mt-2 w-full flex-row gap-3">
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
              <SectionLabel>{`${category} · ${categoryPods.length}`}</SectionLabel>
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
        {groups.length === 0 ? (
          <EmptyState
            art={<PodsArt width={220} />}
            title="No pods yet"
            body="Pods are the rooms inside a hub, one for each topic. Make the first one."
            action={canManage ? { label: "Create a pod", onPress: () => router.push({ pathname: "/hub/[hubId]/new-pod", params: { hubId: hub.id } }) } : undefined}
          />
        ) : (
          <>
            {canManage ? (
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Create a new pod"
                onPress={() => router.push({ pathname: "/hub/[hubId]/new-pod", params: { hubId: hub.id } })}
                className="mx-5 mt-4 flex-row items-center gap-4 rounded-3xl border border-dashed border-line p-4"
              >
                <View className="size-11 items-center justify-center rounded-2xl bg-raised">
                  <Ionicons name="add" size={22} color={colors.ink} />
                </View>
                <View className="flex-1">
                  <Text className="text-[16px] font-sans-semibold text-ink">New pod</Text>
                  <Text className="text-sm text-muted">Add a room for a new topic.</Text>
                </View>
              </PressableScale>
            ) : null}
            <Text className="px-7 pt-3 text-[13px] text-muted">Press and hold a pod for its settings.</Text>
          </>
        )}

        <View className="px-5">
          <SectionLabel>Invite code</SectionLabel>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={`Invite code ${hub.inviteCode.split("").join(" ")}. Share it`}
            onPress={invite}
            className="flex-row items-center gap-4 rounded-3xl border border-dashed border-line bg-surface px-5 py-4"
          >
            <View className="flex-1">
              <Text className="font-display text-[26px] tracking-[4px] text-ink">{hub.inviteCode}</Text>
              <Text className="mt-0.5 text-[13px] text-muted">Anyone with this code can join.</Text>
            </View>
            <View className="size-11 items-center justify-center rounded-full bg-raised">
              <Ionicons name="share-outline" size={20} color={colors.ink} />
            </View>
          </PressableScale>

          <SectionLabel>About this hub</SectionLabel>
          <SettingGroup>
            <SettingRow icon="grid-outline" title="Pods" value={String(stats.podCount)} />
            <SettingRow icon="people-outline" title="Members" value={String(stats.memberCount)} onPress={() => router.push(`/hub/${hub.id}/members`)} />
            <SettingRow icon="globe-outline" title="Joining" value="With an invite code" last />
          </SettingGroup>

          {role && role !== "owner" ? (
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={`Leave ${hub.name}`}
              onPress={confirmLeave}
              className="mt-6 flex-row items-center gap-3.5 rounded-3xl border border-danger/40 bg-danger/10 px-4 py-4"
            >
              <Ionicons name="exit-outline" size={20} color={colors.danger} />
              <View className="flex-1">
                <Text className="text-base font-sans-semibold text-danger">Leave hub</Text>
                <Text className="text-[13px] text-muted">You can rejoin later with an invite code.</Text>
              </View>
            </PressableScale>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
