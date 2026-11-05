const { colors } = require("@ricochet/shared/tokens");

const kebab = (name) => name.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

// Colours that change with the theme point at CSS variables. The theme provider sets the
// variables for light or dark (see src/theme), so `bg-canvas` works in both without `dark:`.
const themed = Object.fromEntries(
  Object.keys(colors.dark).map((name) => [kebab(name), `rgb(var(--${kebab(name)}) / <alpha-value>)`]),
);

/** @type {import('tailwindcss').Config} */
module.exports = {
  // The app picks its own theme (system, light or dark), so NativeWind must not follow the system.
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        ...themed,
        // The brand colours are the same in both themes.
        accent: colors.accent,
        "accent-ink": colors.accentInk,
        avatar: colors.avatar,
      },
    },
  },
  plugins: [],
};
