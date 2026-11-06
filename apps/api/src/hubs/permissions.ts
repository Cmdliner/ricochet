import type { HubRole } from "@ricochet/shared";

/**
 * Who may do what inside a hub. These are plain functions with no database in sight, so the
 * rules are easy to read, easy to test, and every endpoint asks the same questions.
 */

/** Rename the hub, change its picture and colour, make a new invite code. */
export const canEditHub = (role: HubRole): boolean => role === "owner" || role === "admin";

/** Delete the whole hub. Only the person who made it. */
export const canDeleteHub = (role: HubRole): boolean => role === "owner";

/** Promote someone to admin, or demote them. Only the owner. */
export const canChangeRoles = (role: HubRole): boolean => role === "owner";

/**
 * Remove someone from the hub. The owner can remove anyone but themselves. An admin can remove
 * regular members, but not other admins and not the owner. Members cannot remove anyone.
 */
export function canRemoveMember(actor: HubRole, target: HubRole): boolean {
  if (target === "owner") return false;
  if (actor === "owner") return true;
  if (actor === "admin") return target === "member";
  return false;
}
