import { z } from "zod";

/** The colours a hub can use for its icon. Keys of the avatar palette in the design tokens. */
export const HUB_COLORS = ["coral", "sky", "mint", "amber"] as const;
export const hubColorSchema = z.enum(HUB_COLORS);
export type HubColor = z.infer<typeof hubColorSchema>;

/** Pods offered when someone creates a hub. */
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

/** What an owner or admin can change on a hub. */
export const updateHubSchema = z.object({
  name: hubNameSchema,
  description: hubDescriptionSchema,
  color: hubColorSchema,
});
export type UpdateHubInput = z.infer<typeof updateHubSchema>;

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
