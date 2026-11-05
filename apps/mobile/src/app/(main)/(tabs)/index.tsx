import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HubsArt } from "@/components/illustrations/empty-art";
import { IconButton } from "@/components/ui/icon-button";
import { SectionLabel } from "@/components/ui/section-label";
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
        renderItem={({ item }) => (
          <View className="px-2">
            <HubRow hub={item} />
          </View>
        )}
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="pb-8"
        ListHeaderComponent={
          <View>
            <View className="flex-row items-center justify-between px-4 pt-4">
              <Text className="text-[28px] font-bold tracking-tight text-ink">Hubs</Text>
              <IconButton icon="add" label="Create a hub" variant="accent" onPress={() => router.push("/hubs/new")} />
            </View>

            <View className="mx-4 mt-5 h-12 flex-row items-center gap-2 rounded-full border border-line bg-surface px-4">
              <Ionicons name="search" size={18} color={colors.muted} />
              <TextInput
                accessibilityLabel="Search hubs and pods"
                value={query}
                onChangeText={setQuery}
                placeholder="Search hubs and pods"
                placeholderTextColor={colors.muted}
                selectionColor={colors.accent}
                autoCorrect={false}
                returnKeyType="search"
                className="h-full flex-1 text-base text-ink"
              />
              {searching ? (
                <Pressable accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={10} onPress={() => setQuery("")}>
                  <Ionicons name="close-circle" size={18} color={colors.muted} />
                </Pressable>
              ) : null}
            </View>

            {searching ? null : <JumpBackStrip />}

            <View className="px-4">
              <SectionLabel>{searching ? "Results" : "Your hubs"}</SectionLabel>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View className="items-center gap-2 px-8 pt-10">
            {searching ? (
              <>
                <Text className="text-lg font-semibold text-ink">No matches</Text>
                <Text className="text-center text-muted">Nothing called “{query.trim()}” in your hubs or pods.</Text>
              </>
            ) : (
              <>
                <HubsArt />
                <Text className="text-lg font-semibold text-ink">No hubs yet</Text>
                <Text className="text-center text-muted">Create a hub for your community, or join one with an invite code.</Text>
              </>
            )}
          </View>
        }
        ListFooterComponent={
          searching ? undefined : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Join a hub with an invite code"
              onPress={() => router.push("/hubs/join")}
              className="mx-4 mt-4 flex-row items-center gap-4 rounded-3xl border border-dashed border-line px-4 py-4 active:bg-raised"
            >
              <View className="size-11 items-center justify-center rounded-2xl bg-raised">
                <Ionicons name="link" size={20} color={colors.ink} />
              </View>
              <View className="flex-1">
                <Text className="text-[16px] font-semibold text-ink">Join a hub</Text>
                <Text className="text-sm text-muted">Have an invite code? Enter it here.</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </Pressable>
          )
        }
      />
    </SafeAreaView>
  );
}
