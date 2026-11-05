import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LogoMark } from "./logo-mark";

type AuthScreenProps = {
  /** An illustration shown under the logo. */
  art?: ReactNode;
  title: string;
  subtitle: string;
  children: ReactNode;
  /** Shown pinned at the bottom, for secondary actions. */
  footer?: ReactNode;
};

/** The frame shared by every step of sign in: logo, heading, then the form. */
export function AuthScreen({ art, title, subtitle, children, footer }: AuthScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerClassName="flex-grow px-6 pt-10 pb-6"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="mb-8 gap-3">
            <LogoMark size={44} />
            {art ? <View className="items-center py-2">{art}</View> : null}
            <View className="gap-2">
              <Text className="text-[32px] leading-[38px] font-bold tracking-tight text-ink">{title}</Text>
              <Text className="text-base leading-6 text-muted">{subtitle}</Text>
            </View>
          </View>
          <View className="gap-5">{children}</View>
          {footer ? <View className="mt-auto items-center gap-2 pt-8">{footer}</View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
