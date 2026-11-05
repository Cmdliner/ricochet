import { Text, View } from "react-native";
import { Button } from "./button";
import { router } from "expo-router";

/** Shown when a link points to a hub or pod that does not exist, or that you left. */
export function NotFound({ what }: { what: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-3 px-8">
      <Text className="text-xl font-semibold text-ink">{what} not found</Text>
      <Text className="text-center text-muted">It may have been deleted, or you may no longer have access.</Text>
      <Button label="Go home" className="mt-3 px-8" onPress={() => router.replace("/")} />
    </View>
  );
}
