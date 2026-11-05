import { SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { AnimatedSplash } from "@/components/animated-splash";
import { useAuthStore } from "@/stores/auth-store";
import { ThemeProvider, useTheme } from "@/theme/theme-provider";
import { useThemeStore } from "@/theme/theme-store";
import "../global.css";

// Keep the native splash up until our own animated splash is on screen to take over.
void SplashScreen.preventAutoHideAsync();

function Root() {
  const { colors, scheme } = useTheme();
  const status = useAuthStore((s) => s.status);
  const profileComplete = useAuthStore((s) => s.user?.profileComplete ?? false);
  const themeLoaded = useThemeStore((s) => s.loaded);
  const [splashDone, setSplashDone] = useState(false);
  const finishSplash = useCallback(() => setSplashDone(true), []);

  useEffect(() => {
    void useThemeStore.getState().load();
    void useAuthStore.getState().restore();
  }, []);

  const ready = status !== "loading" && themeLoaded;
  const signedIn = status === "signedIn";

  return (
    <>
      {/* The splash is accent coloured, so the status bar text is dark while it shows. */}
      <StatusBar style={splashDone ? (scheme === "dark" ? "light" : "dark") : "dark"} />
      {ready ? (
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}>
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
      ) : null}
      {splashDone ? null : <AnimatedSplash ready={ready} onFinish={finishSplash} />}
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Root />
    </ThemeProvider>
  );
}
