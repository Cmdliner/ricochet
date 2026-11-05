import { colors } from "@ricochet/shared";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";

export default function You() {
  const user = useAuthStore((s) => s.user);
  const initial = (user?.displayName ?? "?").trim().charAt(0).toUpperCase();

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      <View className="flex-1 px-4">
        <Text className="pt-4 pb-6 text-[28px] font-bold tracking-tight text-ink">You</Text>

        <View className="flex-row items-center gap-4 rounded-3xl border border-line bg-surface p-5">
          <View
            className="size-16 items-center justify-center rounded-full"
            style={{ backgroundColor: colors.avatar.coral }}
          >
            <Text className="text-2xl font-bold text-black">{initial}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-lg font-semibold text-ink" numberOfLines={1}>
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
