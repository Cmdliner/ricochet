/** Stand-ins for profile details the API does not provide yet. Replace with real data later. `bio` and `status` only seed the profile store. */
export const MOCK_PROFILE = {
  bio: "Building things at odd hours. Voice notes over long texts, always.",
  status: { emoji: "🎧", text: "Heads down, back soon" },
  joined: "Joined March 2026",
  stats: { notes: 128, streak: 12 },
  appVersion: "0.1.0",
} as const;
