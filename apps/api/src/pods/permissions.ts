import type { HubRole } from "@ricochet/shared";

export function canSeePod(hubRole: HubRole | null, pod: { isPrivate: boolean }, isParticipant: boolean): boolean {
  return hubRole !== null && (!pod.isPrivate || isParticipant);
}
