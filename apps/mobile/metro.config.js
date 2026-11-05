const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

// `expo/metro-config` already understands pnpm workspaces, so no watchFolders or
// nodeModulesPaths are needed here.
const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./src/global.css" });
