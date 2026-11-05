import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar } from "@/components/ui/avatar";
import { NotFound } from "@/components/ui/not-found";
import { ScreenHeader } from "@/components/ui/screen-header";
import { pluralize } from "@/features/hubs/format";
import { useHub, useHubsStore } from "@/features/hubs/store";
import { ME_ID, type Role } from "@/features/hubs/types";

const ROLE_ORDER: Record<Role, number> = { owner: 0, admin: 1, member: 2 };

export default function MembersScreen() {
  const { hubId } = useLocalSearchParams<{ hubId: string }>();
  const hub = useHub(hubId);
  const people = useHubsStore((s) => s.members);

  // Online people first, then by role, then by name.
  const rows = useMemo(() => {
    if (!hub) return [];
    return hub.members
      .map((entry) => ({ role: entry.role, member: people[entry.id] }))
      .filter((row): row is { role: Role; member: NonNullable<typeof row.member> } => !!row.member)
      .sort(
        (a, b) =>
          Number(b.member.online) - Number(a.member.online) ||
          ROLE_ORDER[a.role] - ROLE_ORDER[b.role] ||
          a.member.name.localeCompare(b.member.name),
      );
  }, [hub, people]);

  if (!hub) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
        <NotFound what="Hub" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      <ScreenHeader title="Members" subtitle={`${hub.name} · ${pluralize(rows.length, "person", "people")}`} />
      <FlatList
        data={rows}
        keyExtractor={(row) => row.member.id}
        contentContainerClassName="px-2 py-3"
        renderItem={({ item: { member, role } }) => (
          <View className="flex-row items-center gap-4 rounded-3xl px-3 py-3">
            <View>
              <Avatar name={member.name} color={member.color} size={48} />
              {member.online ? (
                <View className="absolute right-0 bottom-0 size-4 rounded-full border-2 border-canvas bg-online" />
              ) : null}
            </View>
            <View className="flex-1">
              <Text className="text-[16px] font-semibold text-ink" numberOfLines={1}>
                {member.id === ME_ID ? "You" : member.name}
              </Text>
              <Text className="text-sm text-muted" numberOfLines={1}>
                @{member.handle}
              </Text>
            </View>
            {role !== "member" ? (
              <View className="rounded-full bg-raised px-3 py-1">
                <Text className="text-xs font-semibold text-muted capitalize">{role}</Text>
              </View>
            ) : null}
          </View>
        )}
      />
    </SafeAreaView>
  );
}
