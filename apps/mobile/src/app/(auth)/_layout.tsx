import { colors } from "@ricochet/shared";
import { Stack } from "expo-router";

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.dark.canvas } }} />;
}
