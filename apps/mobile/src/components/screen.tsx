import type { ComponentProps, ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmptyState } from "@/components/ui/empty-state";
import { Text } from "@/components/ui/text";

type ScreenProps = Pick<ComponentProps<typeof EmptyState>, "art" | "action" | "secondary" | "hints"> & {
  title: string;
  emptyTitle: string;
  emptyBody: string;
  children?: ReactNode;
};

export function Screen({ title, art, emptyTitle, emptyBody, action, secondary, hints, children }: ScreenProps) {
  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      {/* Padding lives on this inner view: SafeAreaView manages its own padding and would override it. */}
      <View className="flex-1 px-4">
        <Text className="pt-4 pb-2 font-display text-[28px] tracking-tight text-ink">{title}</Text>
        {children ?? (
          <ScrollView contentContainerClassName="flex-grow justify-center pb-16" showsVerticalScrollIndicator={false}>
            <EmptyState art={art} title={emptyTitle} body={emptyBody} action={action} secondary={secondary} hints={hints} />
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
