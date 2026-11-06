import type { HubColor } from "@ricochet/shared";
import { create } from "zustand";
import { MOCK_PROFILE } from "./mock-profile";

/**
 * The profile details the API does not store yet, held in memory. Name and handle are real and
 * live in the auth store. When the API grows these fields, this store keeps its shape and its
 * action becomes an API call.
 */

export type ProfileStatus = { emoji: string; text: string };

export const BIO_MAX = 120;
export const STATUS_MAX = 40;

type ProfileState = {
  bio: string;
  status: ProfileStatus | null;
  avatarColor: HubColor;
  update: (patch: Partial<Pick<ProfileState, "bio" | "status" | "avatarColor">>) => void;
};

export const useProfileStore = create<ProfileState>((set) => ({
  bio: MOCK_PROFILE.bio,
  status: { ...MOCK_PROFILE.status },
  avatarColor: "coral",
  update: (patch) => set(patch),
}));
