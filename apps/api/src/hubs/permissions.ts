import type { HubRole } from "@ricochet/shared";

export const canEditHub = (role: HubRole): boolean => role === "owner" || role === "admin";

export const canDeleteHub = (role: HubRole): boolean => role === "owner";

export const canChangeRoles = (role: HubRole): boolean => role === "owner";

export function canRemoveMember(actor: HubRole, target: HubRole): boolean {
  if (target === "owner") return false;
  if (actor === "owner") return true;
  if (actor === "admin") return target === "member";
  return false;
}
