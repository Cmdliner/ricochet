import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ScreenProps = {
  title: string;
  /** Short line shown under the empty state title. */
  emptyTitle: string;
  emptyBody: string;
  children?: ReactNode;
};

/** Shared frame for the tab screens: a big title and an empty state, in the Ricochet look. */
export function Screen({ title, emptyTitle, emptyBody, children }: ScreenProps) {
  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      {/* Padding lives on this inner view: SafeAreaView manages its own padding and would override it. */}
      <View className="flex-1 px-4">
        <Text className="pt-4 pb-6 text-[28px] font-bold tracking-tight text-ink">{title}</Text>
        {children ?? (
          <View className="flex-1 items-center justify-center gap-2 pb-24">
            <View className="mb-3 size-16 items-center justify-center rounded-full bg-raised">
              <View className="size-3 rounded-full bg-accent" />
            </View>
            <Text className="text-lg font-semibold text-ink">{emptyTitle}</Text>
            <Text className="max-w-[260px] text-center text-muted">{emptyBody}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
