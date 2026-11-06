import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { router } from "expo-router";
import { Alert, ScrollView, View } from "react-native";
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
import { MOCK_PROFILE } from "@/features/profile/mock-profile";
import { useProfileStore } from "@/features/profile/store";
import { useAuthStore } from "@/stores/auth-store";
import { useTheme } from "@/theme/theme-provider";
import type { Preference } from "@/theme/themes";

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
  Alert.alert(feature, "This is coming soon.");
}

export default function You() {
  const user = useAuthStore((s) => s.user);
  const hubs = useHubsStore((s) => s.hubs);
  const pods = useHubsStore((s) => s.pods);
  const { bio, status, avatarColor } = useProfileStore();
  const { colors, preference, setPreference } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [haptics, setHaptics] = useState(true);

  const name = user?.displayName ?? "You";
  const myHubs = hubs.length;
  const myPods = pods.filter((pod) => hubs.some((hub) => hub.id === pod.hubId)).length;

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      <BrandBar />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-10">
        <Animated.View entering={FadeInDown.duration(380)}>
          {/* A flat colour band with the avatar sitting over its lower edge. */}
          <View className="mx-4 mt-1 h-28 overflow-hidden rounded-[28px] bg-accent">
            <View className="absolute -top-8 -right-6 size-32 rounded-full bg-accent-ink/10" />
            <View className="absolute -bottom-10 left-24 size-24 rounded-full bg-white/15" />
          </View>

          <View className="-mt-12 px-6">
            <View className="flex-row items-end justify-between">
              <View className="rounded-full bg-canvas p-1.5">
                <Avatar name={name} color={avatarColor} size={88} />
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
                <Text className="text-sm text-muted">{MOCK_PROFILE.joined}</Text>
              </View>
            </View>
          </View>

          <View className="mx-4 mt-6 flex-row rounded-3xl border border-line bg-surface">
            <Stat value={myHubs} label="Hubs" />
            <View className="my-4 w-px bg-line" />
            <Stat value={myPods} label="Pods" />
            <View className="my-4 w-px bg-line" />
            <Stat value={MOCK_PROFILE.stats.notes} label="Voice notes" />
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
            <SettingRow icon="notifications-outline" title="Notifications" toggle={{ value: notifications, onChange: setNotifications }} />
            <SettingRow icon="phone-portrait-outline" title="Haptic feedback" toggle={{ value: haptics, onChange: setHaptics }} />
            <SettingRow icon="moon-outline" title="Quiet hours" value="Off" onPress={() => soon("Quiet hours")} last />
          </SettingGroup>

          <SectionLabel>Account</SectionLabel>
          <SettingGroup>
            <SettingRow icon="mail-outline" title="Email" value={user?.email} />
            <SettingRow icon="lock-closed-outline" title="Privacy" onPress={() => soon("Privacy")} />
            <SettingRow icon="help-circle-outline" title="Help and feedback" onPress={() => soon("Help and feedback")} last />
          </SettingGroup>

          <View className="mt-8">
            <Button label="Sign out" variant="ghost" className="border border-line" onPress={() => void useAuthStore.getState().signOut()} />
            <Text className="mt-4 text-center text-xs text-muted">Ricochet {MOCK_PROFILE.appVersion}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
