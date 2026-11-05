const { colors } = require("@ricochet/shared/tokens");

/** @type {import('tailwindcss').Config} */
module.exports = {
  // The app is dark only for now and sets its own colour scheme, so NativeWind must not follow the system.
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // The same tokens the website uses, from packages/shared. Dark is the default theme.
      colors: {
        ...colors.dark,
        accent: colors.accent,
        "accent-ink": colors.accentInk,
        avatar: colors.avatar,
      },
    },
  },
  plugins: [],
};
