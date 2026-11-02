export const SITE = {
  name: "Ricochet",
  tagline: "Conversations that bounce right back.",
  description:
    "Ricochet is real-time messaging with hubs for your communities and private chats with voice messages and video notes.",
  year: 2026,
  // TODO: replace with the real support address before launch.
  contactEmail: "support@ricochet.app",
} as const;

export const THEME_COLOR = "#000000";

export const NAV_LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/#hubs", label: "Hubs" },
  { href: "/#voice-video", label: "Voice and video" },
  { href: "/download", label: "Download" },
] as const;

export const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/#features", label: "Features" },
      { href: "/#hubs", label: "Hubs and pods" },
      { href: "/#voice-video", label: "Voice and video" },
      { href: "/download", label: "Download" },
      { href: "/#waitlist", label: "Join the waitlist" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms of service" },
      { href: "/privacy", label: "Privacy policy" },
      { href: "/cookies", label: "Cookie policy" },
    ],
  },
] as const;

export const COOKIE_STORAGE_KEY = "ricochet-cookie-notice";
export const COOKIE_EVENT = "ricochet:cookie-notice";

/** Flat avatar colours used in the product previews. */
export const AVATAR_COLORS = {
  coral: "#f4a6a6",
  mint: "#93e0b8",
  amber: "#f3cb7d",
  sky: "#9fc9f4",
} as const;

/** Bar heights (px) for the voice message waveform. */
export const WAVEFORM_BARS = [
  8, 14, 10, 20, 26, 16, 10, 22, 28, 18, 12, 24, 16, 9, 20, 14, 8, 12, 18, 10, 22, 14,
] as const;

export const STORES = [
  {
    id: "ios",
    platform: "iOS",
    store: "App Store",
    description: "For iPhone and iPad.",
  },
  {
    id: "android",
    platform: "Android",
    store: "Google Play",
    description: "For Android phones and tablets.",
  },
] as const;
