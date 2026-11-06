import { SplashScreen, Stack } from "expo-router";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { useCallback, useEffect, useState } from "react";
import { AnimatedSplash } from "@/components/animated-splash";
import { useAuthStore } from "@/stores/auth-store";
import { FONT_ASSETS } from "@/theme/fonts";
import { palettes } from "@/theme/themes";
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
  // A font that fails to load must not block the app: text falls back to the system font.
  const [fontsLoaded, fontError] = useFonts(FONT_ASSETS);
  const [splashDone, setSplashDone] = useState(false);
  const finishSplash = useCallback(() => setSplashDone(true), []);

  useEffect(() => {
    void useThemeStore.getState().load();
    void useAuthStore.getState().restore();
  }, []);

  // The native window sits behind everything, and app.json paints it brand orange for the splash.
  // Anywhere the app does not draw over it (under the status and navigation bars, behind the
  // keyboard, while overscrolling) that colour would show. Follow the theme once the splash is gone.
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(splashDone ? colors.canvas : palettes.dark.accent).catch(() => undefined);
  }, [splashDone, colors.canvas]);

  const ready = status !== "loading" && themeLoaded && (fontsLoaded || !!fontError);
  const signedIn = status === "signedIn";

  return (
    <>
      {/* The splash is accent coloured, so the status bar text is dark while it shows. */}
      <StatusBar style={splashDone ? (scheme === "dark" ? "light" : "dark") : "dark"} />
      {ready ? (
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}>
          {/* Each group is only reachable in its own state. Expo Router redirects when the state changes. */}
          <Stack.Protected guard={signedIn && profileComplete}>
            <Stack.Screen name="(main)" />
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
    <KeyboardProvider statusBarTranslucent navigationBarTranslucent>
      <ThemeProvider>
        <Root />
      </ThemeProvider>
    </KeyboardProvider>
  );
}
