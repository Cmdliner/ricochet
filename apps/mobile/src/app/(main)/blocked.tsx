import { View } from "react-native";
import { Avatar } from "@/components/ui/avatar";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Sheet } from "@/components/ui/sheet";
import { Text } from "@/components/ui/text";
import { confirmUnblock } from "@/features/safety/actions";
import { useSafetyStore } from "@/features/safety/store";

export default function BlockedSheet() {
  const blocked = useSafetyStore((s) => s.blocked);

  return (
    <Sheet title="Blocked people">
      <View className="gap-1 pb-2">
        {blocked.length === 0 ? (
          <Text className="py-6 text-center text-muted">You have not blocked anyone.</Text>
        ) : (
          <Text className="pb-2 text-sm text-muted">You do not see their messages and they cannot write to you. They are not told.</Text>
        )}
        {blocked.map((person) => (
          <View key={person.id} className="flex-row items-center gap-4 rounded-2xl py-2.5">
            <Avatar name={person.name} color={person.color} uri={person.avatarUrl} size={48} />
            <View className="flex-1">
              <Text className="text-[16px] font-sans-semibold text-ink" numberOfLines={1}>
                {person.name}
              </Text>
              <Text className="text-sm text-muted" numberOfLines={1}>
                @{person.handle}
              </Text>
            </View>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={`Unblock ${person.name}`}
              onPress={() => confirmUnblock(person)}
              className="rounded-full bg-raised px-4 py-2"
            >
              <Text className="text-sm font-sans-semibold text-ink">Unblock</Text>
            </PressableScale>
          </View>
        ))}
      </View>
    </Sheet>
  );
}
