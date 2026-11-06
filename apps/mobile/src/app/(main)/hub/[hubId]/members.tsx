import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { View } from "react-native";
import { Avatar } from "@/components/ui/avatar";
import { Sheet } from "@/components/ui/sheet";
import { Text } from "@/components/ui/text";
import { pluralize } from "@/features/hubs/format";
import { useHub, useHubsStore } from "@/features/hubs/store";
import { ME_ID, type Role } from "@/features/hubs/types";

const ROLE_ORDER: Record<Role, number> = { owner: 0, admin: 1, member: 2 };

export default function MembersSheet() {
  const { hubId } = useLocalSearchParams<{ hubId: string }>();
  const hub = useHub(hubId);
  const people = useHubsStore((s) => s.members);

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

  return (
    <Sheet title={hub ? `${hub.name} · ${pluralize(rows.length, "member")}` : "Members"}>
      <View className="gap-1 pb-2">
        {rows.map(({ member, role }) => (
          <View key={member.id} className="flex-row items-center gap-4 rounded-2xl py-2.5">
            <View>
              <Avatar name={member.name} color={member.color} size={48} />
              {member.online ? (
                <View className="absolute right-0 bottom-0 size-4 rounded-full border-2 border-surface bg-online" />
              ) : null}
            </View>
            <View className="flex-1">
              <Text className="text-[16px] font-sans-semibold text-ink" numberOfLines={1}>
                {member.id === ME_ID ? "You" : member.name}
              </Text>
              <Text className="text-sm text-muted" numberOfLines={1}>
                @{member.handle}
              </Text>
            </View>
            {role !== "member" ? (
              <View className="rounded-full bg-raised px-3 py-1">
                <Text className="text-xs font-sans-semibold text-muted capitalize">{role}</Text>
              </View>
            ) : null}
          </View>
        ))}
      </View>
    </Sheet>
  );
}
