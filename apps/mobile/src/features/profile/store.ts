import type { HubColor } from "@ricochet/shared";
import { create } from "zustand";
import { MOCK_PROFILE } from "./mock-profile";

// Name and handle are real and live in the auth store. The rest is mock data until the API stores it.

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
