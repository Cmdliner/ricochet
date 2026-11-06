import type { ReactNode } from "react";
import { View } from "react-native";
import { LogoMark } from "./logo-mark";
import { Wordmark } from "./wordmark";

/**
 * The top row of the main screens: the Ricochet mark and name on the left, and room for an action
 * on the right. It is what tells you which app you are in, the way a messaging app names itself.
 */
export function BrandBar({ right }: { right?: ReactNode }) {
  return (
    <View className="h-14 flex-row items-center justify-between px-5">
      <View className="flex-row items-center gap-2.5">
        <LogoMark size={30} />
        <Wordmark size={27} />
      </View>
      {right ? <View className="flex-row items-center gap-2">{right}</View> : null}
    </View>
  );
}
