import { colors } from "@ricochet/shared";
import { SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import "../global.css";

// Keep the splash screen up until we know whether someone is signed in.
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const status = useAuthStore((s) => s.status);
  const profileComplete = useAuthStore((s) => s.user?.profileComplete ?? false);

  useEffect(() => {
    void useAuthStore.getState().restore();
  }, []);

  useEffect(() => {
    if (status !== "loading") void SplashScreen.hideAsync();
  }, [status]);

  if (status === "loading") return null;

  const signedIn = status === "signedIn";

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.dark.canvas } }}>
        {/* Each group is only reachable in its own state. Expo Router redirects when the state changes. */}
        <Stack.Protected guard={signedIn && profileComplete}>
          <Stack.Screen name="(tabs)" />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && !profileComplete}>
          <Stack.Screen name="profile-setup" />
        </Stack.Protected>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
    </>
  );
}
