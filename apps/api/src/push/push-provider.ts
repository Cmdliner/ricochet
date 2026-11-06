/**
 * What the app needs from a push service, and nothing specific to one. Expo's push service implements it today.
 * Switching to Firebase and Apple directly later means writing one more class with this one method.
 */
export type PushMessage = {
  /** The device address the provider handed out. */
  to: string;
  title: string;
  body: string;
  /** Shown to nobody. The app reads it when the notification is tapped, to open the right screen. */
  data: Record<string, string>;
};

/** `invalid-token` means the device is gone for good (app uninstalled, permission revoked) and its token should be forgotten. */
export type PushOutcome = { to: string; status: "ok" | "invalid-token" | "failed" };

export interface PushProvider {
  send(messages: PushMessage[]): Promise<PushOutcome[]>;
}

export const PUSH_PROVIDER = Symbol("PUSH_PROVIDER");
