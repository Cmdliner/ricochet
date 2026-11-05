import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Where the API lives. Set EXPO_PUBLIC_API_URL to override (see .env.example).
 *
 * By default we reuse the machine running the Expo dev server, which works on a real phone
 * over Wi-Fi. An Android emulator is different: Expo reports the host as 127.0.0.1, but inside
 * the emulator that address is the emulator itself. It reaches your computer at 10.0.2.2.
 */
function defaultApiUrl() {
  const devHost = Constants.expoConfig?.hostUri?.split(":")[0];
  const isLoopback = !devHost || devHost === "127.0.0.1" || devHost === "localhost";

  if (Platform.OS === "android" && isLoopback) return "http://10.0.2.2:3001";
  if (devHost) return `http://${devHost}:3001`;
  return "http://localhost:3001";
}

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? defaultApiUrl();
