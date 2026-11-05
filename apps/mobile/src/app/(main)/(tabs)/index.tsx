import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, TextInput, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { HubsArt } from "@/components/illustrations/empty-art";
import { IconButton } from "@/components/ui/icon-button";
import { PressableScale } from "@/components/ui/pressable-scale";
import { SectionLabel } from "@/components/ui/section-label";
import { Text } from "@/components/ui/text";
import { HubRow } from "@/features/hubs/components/hub-row";
import { JumpBackStrip } from "@/features/hubs/components/jump-back-strip";
import { useHubsStore } from "@/features/hubs/store";
import { useTheme } from "@/theme/theme-provider";

export default function Hubs() {
  const { colors } = useTheme();
  const hubs = useHubsStore((s) => s.hubs);
  const pods = useHubsStore((s) => s.pods);
  const [query, setQuery] = useState("");
  const searching = query.trim().length > 0;

  // A hub matches when its name does, or when one of its pods does.
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return hubs;
    return hubs.filter(
      (hub) =>
        hub.name.toLowerCase().includes(q) || pods.some((pod) => pod.hubId === hub.id && pod.name.toLowerCase().includes(q)),
    );
  }, [hubs, pods, query]);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      <FlatList
        data={visible}
        keyExtractor={(hub) => hub.id}
        renderItem={({ item, index }) => (
          // Each card eases in just after the one above it.
          <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 55).duration(340)} style={{ marginHorizontal: 20, marginBottom: 10 }}>
            <HubRow hub={item} />
          </Animated.View>
        )}
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="pb-10"
        ListHeaderComponent={
          <View>
            <View className="flex-row items-center justify-between px-5 pt-5">
              <Text className="font-display text-[32px] tracking-tight text-ink">Hubs</Text>
              <IconButton icon="add" label="Add a hub" variant="accent" size={46} onPress={() => router.push("/hubs/add")} />
            </View>

            <View className="mx-5 mt-5 h-12 flex-row items-center gap-3 rounded-2xl bg-raised px-4">
              <Ionicons name="search" size={19} color={colors.muted} />
              <TextInput
                accessibilityLabel="Search hubs and pods"
                value={query}
                onChangeText={setQuery}
                placeholder="Search hubs and pods"
                placeholderTextColor={colors.muted}
                selectionColor={colors.accent}
                autoCorrect={false}
                returnKeyType="search"
                className="h-full flex-1 font-sans text-base text-ink"
              />
              {searching ? (
                <Pressable accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={10} onPress={() => setQuery("")}>
                  <Ionicons name="close-circle" size={19} color={colors.muted} />
                </Pressable>
              ) : null}
            </View>

            {searching ? null : <JumpBackStrip />}

            <View className="px-5 pb-1">
              <SectionLabel>{searching ? "Results" : "Your hubs"}</SectionLabel>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View className="items-center gap-2 px-8 pt-10">
            {searching ? (
              <>
                <Text className="text-lg font-sans-semibold text-ink">No matches</Text>
                <Text className="text-center text-muted">Nothing called “{query.trim()}” in your hubs or pods.</Text>
              </>
            ) : (
              <>
                <HubsArt />
                <Text className="text-lg font-sans-semibold text-ink">No hubs yet</Text>
                <Text className="text-center text-muted">Create a hub for your community, or join one with an invite code.</Text>
              </>
            )}
          </View>
        }
        ListFooterComponent={
          searching ? undefined : (
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Join a hub with an invite code"
              onPress={() => router.push("/hubs/join")}
              className="mx-5 mt-2 flex-row items-center gap-4 rounded-3xl border border-dashed border-line p-4"
            >
              <View className="size-11 items-center justify-center rounded-2xl bg-raised">
                <Ionicons name="link" size={20} color={colors.ink} />
              </View>
              <View className="flex-1">
                <Text className="text-[16px] font-sans-semibold text-ink">Join a hub</Text>
                <Text className="text-sm text-muted">Have an invite code? Enter it here.</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </PressableScale>
          )
        }
      />
    </SafeAreaView>
  );
}
