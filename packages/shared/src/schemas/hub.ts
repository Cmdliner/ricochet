import { z } from "zod";

export const HUB_COLORS = ["coral", "sky", "mint", "amber"] as const;
export const hubColorSchema = z.enum(HUB_COLORS);
export type HubColor = z.infer<typeof hubColorSchema>;

/** Each is the name of an Ionicons glyph. */
export const HUB_ICONS = [
  "rocket",
  "color-palette",
  "book",
  "game-controller",
  "flash",
  "planet",
  "leaf",
  "musical-notes",
  "cafe",
  "flame",
  "camera",
  "bicycle",
  "code-slash",
  "paw",
  "trophy",
  "heart",
] as const;
export const hubIconSchema = z.enum(HUB_ICONS);
export type HubIcon = z.infer<typeof hubIconSchema>;

export function defaultHubIcon(name: string): HubIcon {
  let hash = 0;
  for (const char of name.trim().toLowerCase()) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return HUB_ICONS[hash % HUB_ICONS.length] ?? "rocket";
}

export const STARTER_PODS = ["general", "announcements", "off-topic"] as const;
export const starterPodSchema = z.enum(STARTER_PODS);
export type StarterPod = z.infer<typeof starterPodSchema>;

export const hubNameSchema = z
  .string()
  .trim()
  .min(2, "Give your hub a name.")
  .max(40, "Keep the name under 40 characters.");

export const createHubSchema = z.object({
  name: hubNameSchema,
  color: hubColorSchema,
  icon: hubIconSchema.optional(),
  starterPods: z.array(starterPodSchema).min(1, "Pick at least one pod to start with."),
});
export type CreateHubInput = z.infer<typeof createHubSchema>;

export const inviteCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]{4,12}$/, "Invite codes are 4 to 12 letters and numbers.");

export const joinHubSchema = z.object({ code: inviteCodeSchema });
export type JoinHubInput = z.infer<typeof joinHubSchema>;

export const hubDescriptionSchema = z.string().trim().max(160, "Keep the description under 160 characters.");

export const updateHubSchema = z.object({
  name: hubNameSchema,
  description: hubDescriptionSchema,
  color: hubColorSchema,
  icon: hubIconSchema,
});
export type UpdateHubInput = z.infer<typeof updateHubSchema>;

export const patchHubSchema = updateHubSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, { message: "Nothing to change." });
export type PatchHubInput = z.infer<typeof patchHubSchema>;

/** "Design Crits!" becomes "design-crits": pod names are lowercase words joined by hyphens. */
export function toPodName(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

export const podNameSchema = z
  .string()
  .min(2, "Use at least 2 letters or numbers.")
  .max(32, "Keep the name under 32 characters.")
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens.");

export const podCategorySchema = z.string().trim().min(2, "Name the category.").max(24, "Keep the category under 24 characters.");

export const createPodSchema = z.object({
  name: podNameSchema,
  category: podCategorySchema,
  description: z.string().trim().max(120, "Keep the description under 120 characters."),
  isPrivate: z.boolean(),
});
export type CreatePodInput = z.infer<typeof createPodSchema>;

export const hubRoleSchema = z.enum(["owner", "admin", "member"]);
export type HubRole = z.infer<typeof hubRoleSchema>;

export const hubSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string(),
  color: hubColorSchema,
  icon: hubIconSchema,
  inviteCode: z.string(),
  memberCount: z.number().int(),
  podCount: z.number().int(),
  myRole: hubRoleSchema,
  createdAt: z.string(),
});
export type HubView = z.infer<typeof hubSchema>;

export const hubMemberSchema = z.object({
  userId: z.uuid(),
  displayName: z.string(),
  handle: z.string(),
  avatarColor: hubColorSchema,
  avatarUrl: z.string().nullable(),
  role: hubRoleSchema,
  joinedAt: z.string(),
});
export type HubMember = z.infer<typeof hubMemberSchema>;

export const setMemberRoleSchema = z.object({ role: z.enum(["admin", "member"]) });
export type SetMemberRoleInput = z.infer<typeof setMemberRoleSchema>;
