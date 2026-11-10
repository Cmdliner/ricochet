import { Pressable, View } from "react-native";
import { Avatar } from "@/components/ui/avatar";
import { Text } from "@/components/ui/text";
import type { Member } from "../types";

/** The people offered while a tag is being typed. Tapping one writes their handle into the message. */
export function MentionSuggestions({ people, onPick }: { people: Member[]; onPick: (member: Member) => void }) {
  if (people.length === 0) return null;
  return (
    <View accessibilityLabel="People you can tag" className="mb-2 overflow-hidden rounded-2xl bg-raised">
      {people.map((person) => (
        <Pressable
          key={person.id}
          accessibilityRole="button"
          accessibilityLabel={`Tag ${person.name}, @${person.handle}`}
          onPress={() => onPick(person)}
          className="flex-row items-center gap-3 px-3 py-2 active:bg-line"
        >
          <Avatar name={person.name} color={person.color} uri={person.avatarUrl} size={32} />
          <Text className="shrink text-[15px] font-sans-semibold text-ink" numberOfLines={1}>
            {person.name}
          </Text>
          <Text className="flex-1 text-sm text-muted" numberOfLines={1}>
            @{person.handle}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
