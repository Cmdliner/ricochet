const { colors } = require("@ricochet/shared/tokens");

/** @type {import('tailwindcss').Config} */
module.exports = {
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
