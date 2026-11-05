import { Text, View } from "react-native";

export function DaySeparator({ label }: { label: string }) {
  return (
    <View className="my-4 flex-row items-center gap-3 px-6">
      <View className="h-px flex-1 bg-line" />
      <Text className="text-xs font-semibold tracking-wide text-muted">{label}</Text>
      <View className="h-px flex-1 bg-line" />
    </View>
  );
}
