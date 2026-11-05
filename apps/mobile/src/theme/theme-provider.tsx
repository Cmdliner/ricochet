import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { Appearance, useColorScheme, View } from "react-native";
import { useThemeStore } from "./theme-store";
import { palettes, themeVars, type Palette, type Preference, type Scheme } from "./themes";

type ThemeValue = {
  scheme: Scheme;
  /** Raw colour values for navigators, icons and SVG. Class names cover everything else. */
  colors: Palette;
  preference: Preference;
  setPreference: (preference: Preference) => void;
};

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const preference = useThemeStore((s) => s.preference);
  const setPreference = useThemeStore((s) => s.setPreference);
  const system = useColorScheme();

  // Dark is the fallback while the phone has not told us its setting.
  const scheme: Scheme = preference === "system" ? (system === "light" ? "light" : "dark") : preference;

  // Keep native chrome (keyboard, system dialogs) in step with the in-app choice.
  useEffect(() => {
    try {
      Appearance.setColorScheme(preference === "system" ? "unspecified" : preference);
    } catch {
      // Some platforms do not allow overriding. The in-app colours still follow the choice.
    }
  }, [preference]);

  const value = useMemo<ThemeValue>(
    () => ({ scheme, colors: palettes[scheme], preference, setPreference }),
    [scheme, preference, setPreference],
  );

  return (
    <ThemeContext value={value}>
      {/* The variables set here are what `bg-canvas`, `text-ink` and the rest resolve to. */}
      <View style={[{ flex: 1, backgroundColor: palettes[scheme].canvas }, themeVars[scheme]]}>{children}</View>
    </ThemeContext>
  );
}

export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used inside ThemeProvider.");
  return value;
}
