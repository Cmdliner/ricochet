import { z } from "zod";
import { podCategorySchema, podNameSchema } from "./hub";

const atLeastOne = { message: "Nothing to change." };

export const podSchema = z.object({
  id: z.uuid(),
  hubId: z.uuid(),
  name: z.string(),
  category: z.string(),
  description: z.string(),
  isPrivate: z.boolean(),
  muted: z.boolean(),
  mentionsOnly: z.boolean(),
  createdAt: z.string(),
});
export type PodView = z.infer<typeof podSchema>;

export const updatePodSchema = z
  .object({
    name: podNameSchema,
    category: podCategorySchema,
    description: z.string().trim().max(120, "Keep the description under 120 characters."),
    isPrivate: z.boolean(),
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, atLeastOne);
export type UpdatePodInput = z.infer<typeof updatePodSchema>;

export const podSettingsSchema = z
  .object({ muted: z.boolean(), mentionsOnly: z.boolean() })
  .partial()
  .refine((value) => Object.keys(value).length > 0, atLeastOne);
export type PodSettingsInput = z.infer<typeof podSettingsSchema>;

export const addPodMemberSchema = z.object({ userId: z.uuid() });
export type AddPodMemberInput = z.infer<typeof addPodMemberSchema>;
