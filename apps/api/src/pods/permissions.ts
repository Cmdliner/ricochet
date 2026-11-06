import type { HubRole } from "@ricochet/shared";

export function canSeePod(hubRole: HubRole | null, pod: { isPrivate: boolean }, isParticipant: boolean): boolean {
  if (hubRole === null) return false;
  return hubRole === "owner" || !pod.isPrivate || isParticipant;
}
