import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { create } from "zustand";
import { api } from "./api";

/** The token this phone is registered under, so it can be taken back when the person signs out or turns notifications off. */
type PushState = {
  token: string | null;
  setToken: (token: string | null) => void;
};
export const usePushStore = create<PushState>((set) => ({ token: null, setToken: (token) => set({ token }) }));

export type PushResult = "registered" | "denied" | "unsupported";

const supported = () => Platform.OS !== "web" && Device.isDevice;

/** Asks for permission if it has not been asked yet, then tells the server where to reach this phone. */
export async function registerForPush(): Promise<PushResult> {
  if (!supported()) return "unsupported";

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Messages",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 200, 100, 200],
    });
  }

  let { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== "granted") return "denied";

  const projectId = (Constants.expoConfig?.extra?.eas as { projectId?: string } | undefined)?.projectId ?? Constants.easConfig?.projectId;
  const { data: token } = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
  await api("/devices", { method: "PUT", auth: true, body: { pushToken: token, platform: Platform.OS === "ios" ? "ios" : "android" } });
  usePushStore.getState().setToken(token);
  return "registered";
}

/** Stops notifications to this phone. The server forgets the token, and the phone stops being told. */
export async function unregisterPush(): Promise<void> {
  const token = usePushStore.getState().token;
  if (!token) return;
  usePushStore.getState().setToken(null);
  await api("/devices/unregister", { method: "POST", auth: true, body: { pushToken: token } }).catch(() => undefined);
}
