import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { router } from "expo-router";
import { ScrollView, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrandBar } from "@/components/brand-bar";
import { Avatar } from "@/components/ui/avatar";
import { HubAvatar } from "@/components/ui/hub-avatar";
import { Button } from "@/components/ui/button";
import { PressableScale } from "@/components/ui/pressable-scale";
import { SectionLabel } from "@/components/ui/section-label";
import { Segmented } from "@/components/ui/segmented";
import { SettingGroup, SettingRow } from "@/components/ui/setting-row";
import { Text } from "@/components/ui/text";
import { useHubsStore } from "@/features/hubs/store";
import { useSafetyStore } from "@/features/safety/store";
import { mediaUrl } from "@/lib/media";
import { registerForPush, unregisterPush, usePushStore } from "@/lib/push";
import { useAuthStore } from "@/stores/auth-store";
import { useTheme } from "@/theme/theme-provider";
import type { Preference } from "@/theme/themes";
import { showDialog } from "@/lib/dialog";

const APPEARANCE: { value: Preference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <View className="flex-1 items-center py-4">
      <Text className="font-display text-[22px] tracking-tight text-ink">{value}</Text>
      <Text className="mt-0.5 text-[13px] text-muted">{label}</Text>
    </View>
  );
}

function soon(feature: string) {
  showDialog(feature, "This is coming soon.");
}

async function changePush(on: boolean) {
  if (!on) {
    await unregisterPush();
    return;
  }
  const result = await registerForPush().catch(() => "unsupported" as const);
  if (result === "denied") showDialog("Notifications are off", "Allow notifications for Ricochet in your phone's Settings, then try again.");
  if (result === "unsupported") showDialog("Not available here", "Notifications work on a real phone with the Ricochet app installed.");
}

/** The phone stops being notified before the session ends, otherwise the next person to sign in here would get this person's messages. */
async function signOutCleanly() {
  await unregisterPush();
  await useAuthStore.getState().signOut();
}

export default function You() {
  const user = useAuthStore((s) => s.user);
  const hubs = useHubsStore((s) => s.hubs);
  const pods = useHubsStore((s) => s.pods);
  const chats = useHubsStore((s) => s.chats);
  const blockedCount = useSafetyStore((s) => s.blocked.length);
  const bio = user?.bio ?? "";
  const status = user?.status ?? null;
  const { colors, preference, setPreference } = useTheme();
  const pushToken = usePushStore((s) => s.token);
  const [haptics, setHaptics] = useState(true);

  const name = user?.displayName ?? "You";
  const joined = user?.joinedAt
    ? `Joined ${new Date(user.joinedAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })}`
    : "";
  const myHubs = hubs.length;
  const myPods = pods.filter((pod) => hubs.some((hub) => hub.id === pod.hubId)).length;

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      <BrandBar />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-10">
        <Animated.View entering={FadeInDown.duration(380)}>
          <View className="mx-4 mt-1 h-28 overflow-hidden rounded-[28px] bg-accent">
            <View className="absolute -top-8 -right-6 size-32 rounded-full bg-accent-ink/10" />
            <View className="absolute -bottom-10 left-24 size-24 rounded-full bg-white/15" />
          </View>

          <View className="-mt-12 px-6">
            <View className="flex-row items-end justify-between">
              <View className="rounded-full bg-canvas p-1.5">
                <Avatar name={name} color={user?.avatarColor ?? "coral"} uri={mediaUrl(user?.avatarUrl)} size={88} />
              </View>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Edit profile"
                onPress={() => router.push("/profile/edit")}
                className="mb-2 flex-row items-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5"
              >
                <Ionicons name="create-outline" size={17} color={colors.ink} />
                <Text className="text-sm font-sans-semibold text-ink">Edit profile</Text>
              </PressableScale>
            </View>

            <Text className="mt-3 font-display text-[28px] tracking-tight text-ink" numberOfLines={1}>
              {name}
            </Text>
            <Text className="text-base text-muted">@{user?.handle}</Text>
            {bio ? <Text className="mt-3 text-base leading-6 text-ink">{bio}</Text> : null}

            <View className="mt-4 flex-row flex-wrap items-center gap-2">
              {status ? (
                <View className="flex-row items-center gap-2 rounded-full bg-raised py-1.5 pr-3.5 pl-3">
                  <Text className="text-sm">{status.emoji}</Text>
                  <Text className="text-sm font-sans-medium text-ink">{status.text}</Text>
                </View>
              ) : null}
              <View className="flex-row items-center gap-1.5 px-1">
                <Ionicons name="calendar-outline" size={15} color={colors.muted} />
                <Text className="text-sm text-muted">{joined}</Text>
              </View>
            </View>
          </View>

          <View className="mx-4 mt-6 flex-row rounded-3xl border border-line bg-surface">
            <Stat value={myHubs} label="Hubs" />
            <View className="my-4 w-px bg-line" />
            <Stat value={myPods} label="Pods" />
            <View className="my-4 w-px bg-line" />
            <Stat value={chats.length} label="Chats" />
          </View>
        </Animated.View>

        <View className="px-4">
          {myHubs > 0 ? (
            <>
              <SectionLabel>Your hubs</SectionLabel>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-4 px-1 pb-1">
                {hubs.map((hub) => (
                  <View key={hub.id} className="w-[72px] items-center gap-2">
                    <HubAvatar name={hub.name} color={hub.color} icon={hub.icon} size={60} />
                    <Text className="text-xs font-sans-medium text-muted" numberOfLines={1}>
                      {hub.name}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </>
          ) : null}

          <SectionLabel>Appearance</SectionLabel>
          <Segmented label="Appearance" options={APPEARANCE} value={preference} onChange={setPreference} />

          <SectionLabel>Preferences</SectionLabel>
          <SettingGroup>
            <SettingRow icon="notifications-outline" title="Notifications" toggle={{ value: pushToken !== null, onChange: (on) => void changePush(on) }} />
            <SettingRow icon="phone-portrait-outline" title="Haptic feedback" toggle={{ value: haptics, onChange: setHaptics }} />
            <SettingRow icon="moon-outline" title="Quiet hours" value="Off" onPress={() => soon("Quiet hours")} last />
          </SettingGroup>

          <SectionLabel>Account</SectionLabel>
          <SettingGroup>
            <SettingRow icon="mail-outline" title="Email" value={user?.email} />
            <SettingRow icon="key-outline" title="Password" value={user?.hasPassword ? "On" : "Off"} onPress={() => router.push("/password")} />
            <SettingRow icon="ban-outline" title="Blocked people" value={blockedCount > 0 ? String(blockedCount) : undefined} onPress={() => router.push("/blocked")} />
            <SettingRow icon="lock-closed-outline" title="Privacy" onPress={() => soon("Privacy")} />
            <SettingRow icon="help-circle-outline" title="Help and feedback" onPress={() => soon("Help and feedback")} last />
          </SettingGroup>

          <View className="mt-8">
            <Button label="Sign out" variant="ghost" className="border border-line" onPress={() => void signOutCleanly()} />
            <Text className="mt-4 text-center text-xs text-muted">Ricochet {Constants.expoConfig?.version ?? ""}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
