import { View } from "react-native";
import { Text } from "@/components/ui/text";

export function DaySeparator({ label }: { label: string }) {
  return (
    <View className="my-4 flex-row items-center gap-3 px-6">
      <View className="h-px flex-1 bg-line" />
      <Text className="text-xs font-sans-semibold tracking-wide text-muted">{label}</Text>
      <View className="h-px flex-1 bg-line" />
    </View>
  );
}
