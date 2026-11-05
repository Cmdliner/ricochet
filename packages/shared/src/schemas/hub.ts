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
