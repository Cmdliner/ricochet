/**
 * Design tokens shared by the website and the app.
 * The mobile Tailwind config reads these, so a colour changes in one place.
 */
export const colors = {
  dark: {
    canvas: "#100e0d",
    surface: "#181513",
    raised: "#221e1b",
    line: "#322c28",
    ink: "#f6f1ea",
    muted: "#aaa196",
    /** The accent as small text on this background. */
    accentText: "#f2906f",
    danger: "#f87171",
  },
  light: {
    canvas: "#f3ede3",
    surface: "#fffaf2",
    raised: "#ece4d6",
    line: "#e1d7c7",
    ink: "#1b1613",
    muted: "#6b6157",
    accentText: "#b8431f",
    danger: "#b91c1c",
  },
  accent: "#e9714e",
  accentInk: "#1f0c05",
  /** Soft avatar colours so people are told apart without more accents. */
  avatar: {
    coral: "#f4a6a6",
    mint: "#93e0b8",
    amber: "#f3cb7d",
    sky: "#9fc9f4",
  },
} as const;

export const radius = { bubble: 18, card: 24, pill: 999 } as const;

/** 4 point grid. */
export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32 } as const;
