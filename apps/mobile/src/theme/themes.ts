import { colors } from "@ricochet/shared";
import { vars } from "nativewind";

export type Scheme = "light" | "dark";
export type Preference = "system" | Scheme;

const kebab = (name: string) => name.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

/** "#f3ede3" becomes "243 237 227", the form Tailwind's `rgb(var(--x) / <alpha-value>)` expects. */
function hexToTriple(hex: string) {
  const n = Number.parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

function toVars(palette: Record<string, string>) {
  return vars(Object.fromEntries(Object.entries(palette).map(([name, hex]) => [`--${kebab(name)}`, hexToTriple(hex)])));
}

export const themeVars = {
  light: toVars(colors.light),
  dark: toVars(colors.dark),
} as const;

export const palettes = {
  light: { ...colors.light, accent: colors.accent, accentInk: colors.accentInk, avatar: colors.avatar },
  dark: { ...colors.dark, accent: colors.accent, accentInk: colors.accentInk, avatar: colors.avatar },
} as const;

export type Palette = (typeof palettes)[Scheme];
