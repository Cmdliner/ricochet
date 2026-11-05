import { router } from "expo-router";
import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { IconButton } from "./icon-button";

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  /** Shown between the back button and the title, for example a hub icon. */
  leading?: ReactNode;
  /** Buttons on the right edge. */
  actions?: ReactNode;
  /** Use a close button instead of a back arrow, for screens that open as a sheet. */
  closeStyle?: boolean;
};

/** The top bar for screens pushed on top of the tabs: back, title with subtitle, then actions. */
export function ScreenHeader({ title, subtitle, leading, actions, closeStyle = false }: ScreenHeaderProps) {
  return (
    <View className="h-16 flex-row items-center gap-3 border-b border-line px-3">
      <IconButton
        icon={closeStyle ? "close" : "chevron-back"}
        label={closeStyle ? "Close" : "Back"}
        variant="plain"
        onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
      />
      {leading}
      <View className="flex-1">
        <Text className="text-[17px] font-semibold text-ink" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text className="text-[13px] text-muted" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {actions ? <View className="flex-row items-center gap-1">{actions}</View> : null}
    </View>
  );
}
