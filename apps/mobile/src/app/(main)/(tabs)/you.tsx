import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { useAuthStore } from "@/stores/auth-store";
import { useTheme } from "@/theme/theme-provider";
import type { Preference } from "@/theme/themes";

const APPEARANCE: { value: Preference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export default function You() {
  const user = useAuthStore((s) => s.user);
  const { colors, preference, setPreference } = useTheme();
  const initial = (user?.displayName ?? "?").trim().charAt(0).toUpperCase();

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      {/* Padding lives on this inner view: SafeAreaView manages its own padding and would override it. */}
      <View className="flex-1 px-4">
        <Text className="pt-4 pb-6 font-display text-[28px] tracking-tight text-ink">You</Text>

        <View className="flex-row items-center gap-4 rounded-3xl border border-line bg-surface p-5">
          <View
            className="size-16 items-center justify-center rounded-full"
            style={{ backgroundColor: colors.avatar.coral }}
          >
            <Text className="text-2xl font-sans-bold text-black">{initial}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-lg font-sans-semibold text-ink" numberOfLines={1}>
              {user?.displayName}
            </Text>
            <Text className="text-muted" numberOfLines={1}>
              @{user?.handle}
            </Text>
            <Text className="mt-1 text-sm text-muted" numberOfLines={1}>
              {user?.email}
            </Text>
          </View>
        </View>

        <View className="mt-6 gap-3">
          <Text className="text-sm font-sans-medium text-muted">Appearance</Text>
          <Segmented label="Appearance" options={APPEARANCE} value={preference} onChange={setPreference} />
        </View>

        <View className="mt-auto pb-6">
          <Button
            label="Sign out"
            variant="ghost"
            className="border border-line"
            onPress={() => void useAuthStore.getState().signOut()}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
