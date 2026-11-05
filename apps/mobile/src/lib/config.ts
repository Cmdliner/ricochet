import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Where the API lives. Set EXPO_PUBLIC_API_URL to override (see .env.example).
 *
 * By default we reuse the machine running the Expo dev server, which works on a real phone
 * over Wi-Fi. The Android emulator reaches the host through 10.0.2.2.
 */
function defaultApiUrl() {
  const devHost = Constants.expoConfig?.hostUri?.split(":")[0];
  if (devHost) return `http://${devHost}:3001`;
  return Platform.OS === "android" ? "http://10.0.2.2:3001" : "http://localhost:3001";
}

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? defaultApiUrl();
