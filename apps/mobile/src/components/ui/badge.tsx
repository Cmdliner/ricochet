import { Text, View } from "react-native";

/** The accent pill that shows how many unread messages there are. Renders nothing for zero. */
export function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <View
      accessibilityLabel={`${count} unread`}
      className="h-[22px] min-w-[22px] items-center justify-center rounded-full bg-accent px-1.5"
    >
      <Text className="text-xs font-bold text-accent-ink">{count > 99 ? "99+" : count}</Text>
    </View>
  );
}
