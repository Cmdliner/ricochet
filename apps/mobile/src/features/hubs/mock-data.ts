import { ME_ID, type Hub, type Member, type Message, type Pod, type Reaction } from "./types";

// Mock data in the shape the real API will return.

const MINUTE = 60_000;
const now = Date.now();
export const ago = (minutes: number) => now - minutes * MINUTE;

export const MEMBERS: Record<string, Member> = {
  [ME_ID]: { id: ME_ID, name: "You", handle: "you", color: "coral", online: true },
  mira: { id: "mira", name: "Mira Okafor", handle: "mira", color: "coral", online: true },
  jonah: { id: "jonah", name: "Jonah Reyes", handle: "jonah_r", color: "mint", online: true },
  dee: { id: "dee", name: "Dee Walker", handle: "deewalker", color: "amber", online: false },
  tola: { id: "tola", name: "Tola Adeyemi", handle: "tola", color: "sky", online: true },
  sam: { id: "sam", name: "Sam Park", handle: "sampark", color: "mint", online: false },
  noor: { id: "noor", name: "Noor Haddad", handle: "noor", color: "amber", online: true },
  ife: { id: "ife", name: "Ife Balogun", handle: "ife", color: "coral", online: false },
  leo: { id: "leo", name: "Leo Martins", handle: "leo", color: "sky", online: true },
  priya: { id: "priya", name: "Priya Nair", handle: "priya", color: "mint", online: true },
  kofi: { id: "kofi", name: "Kofi Mensah", handle: "kofi", color: "amber", online: false },
  zara: { id: "zara", name: "Zara Ahmed", handle: "zara", color: "coral", online: true },
};

export const HUBS: Hub[] = [
  {
    id: "ship-it",
    name: "Ship It",
    color: "coral",
    icon: "rocket",
    description: "Indie makers shipping something every week. Share progress, get unstuck.",
    inviteCode: "SHIPIT",
    members: [
      { id: "mira", role: "owner" },
      { id: "jonah", role: "admin" },
      { id: ME_ID, role: "member" },
      { id: "dee", role: "member" },
      { id: "tola", role: "member" },
      { id: "sam", role: "member" },
      { id: "noor", role: "member" },
      { id: "leo", role: "member" },
    ],
  },
  {
    id: "design-club",
    name: "Design Club",
    color: "sky",
    icon: "color-palette",
    description: "Crits, critiques and good taste. Bring a screenshot.",
    inviteCode: "CRITS24",
    members: [
      { id: "tola", role: "owner" },
      { id: ME_ID, role: "admin" },
      { id: "priya", role: "member" },
      { id: "zara", role: "member" },
      { id: "ife", role: "member" },
    ],
  },
  {
    id: "weekend-run",
    name: "Weekend Run",
    color: "mint",
    icon: "bicycle",
    description: "Saturday long runs, Sunday recovery. All paces welcome.",
    inviteCode: "RUN5K",
    members: [
      { id: "kofi", role: "owner" },
      { id: ME_ID, role: "member" },
      { id: "noor", role: "member" },
      { id: "leo", role: "member" },
      { id: "sam", role: "member" },
    ],
  },
  {
    id: "book-circle",
    name: "Book Circle",
    color: "amber",
    icon: "book",
    description: "One book a month, one long conversation about it.",
    inviteCode: "PAGES",
    members: [
      { id: "zara", role: "owner" },
      { id: ME_ID, role: "member" },
      { id: "priya", role: "member" },
      { id: "dee", role: "member" },
    ],
  },
];

export const DISCOVERABLE_HUBS: Hub[] = [
  {
    id: "pixel-lab",
    name: "Pixel Lab",
    color: "sky",
    icon: "game-controller",
    description: "Game jams, pixel art and procedural everything.",
    inviteCode: "BOUNCE",
    members: [
      { id: "leo", role: "owner" },
      { id: "priya", role: "member" },
      { id: "zara", role: "member" },
    ],
  },
];

export const PODS: Pod[] = [
  { id: "ship-welcome", hubId: "ship-it", name: "welcome", category: "Start here", description: "Rules and how this place works", muted: false, isPrivate: false },
  { id: "ship-announce", hubId: "ship-it", name: "announcements", category: "Start here", description: "Hub news from the team", muted: false, isPrivate: false },
  { id: "ship-launch", hubId: "ship-it", name: "launch", category: "Build", description: "Launch day plans and checklists", muted: false, isPrivate: false },
  { id: "ship-feedback", hubId: "ship-it", name: "feedback", category: "Build", description: "Ask for a review of anything", muted: false, isPrivate: false },
  { id: "ship-general", hubId: "ship-it", name: "general", category: "Social", description: "Everything else", muted: false, isPrivate: false },
  { id: "ship-offtopic", hubId: "ship-it", name: "off-topic", category: "Social", description: "Memes, music and the weather", muted: true, isPrivate: false },

  { id: "design-crits", hubId: "design-club", name: "design-crits", category: "Crits", description: "Post work, get honest feedback", muted: false, isPrivate: false },
  { id: "design-inspo", hubId: "design-club", name: "inspo", category: "Crits", description: "Things that made you stop scrolling", muted: false, isPrivate: false },
  { id: "design-general", hubId: "design-club", name: "general", category: "Social", description: "Hello, and everything else", muted: false, isPrivate: false },
  { id: "design-mods", hubId: "design-club", name: "mods", category: "Team", description: "Moderators only", muted: false, isPrivate: true },

  { id: "run-plans", hubId: "weekend-run", name: "plans", category: "Runs", description: "Where and when we meet", muted: false, isPrivate: false },
  { id: "run-general", hubId: "weekend-run", name: "general", category: "Runs", description: "Chat about anything running", muted: false, isPrivate: false },

  { id: "book-current", hubId: "book-circle", name: "this-month", category: "Reading", description: "No spoilers past the page limit", muted: false, isPrivate: false },
  { id: "book-next", hubId: "book-circle", name: "next-up", category: "Reading", description: "Vote on what we read next", muted: false, isPrivate: false },
  { id: "book-general", hubId: "book-circle", name: "general", category: "Social", description: "Say hi", muted: false, isPrivate: false },

  { id: "pixel-general", hubId: "pixel-lab", name: "general", category: "Social", description: "Say hi", muted: false, isPrivate: false },
  { id: "pixel-jams", hubId: "pixel-lab", name: "game-jams", category: "Make", description: "Teams and themes", muted: false, isPrivate: false },
];

export const INITIAL_UNREAD: Record<string, number> = {
  "ship-announce": 1,
  "ship-launch": 12,
  "ship-feedback": 2,
  "design-crits": 3,
  "run-plans": 2,
  "book-current": 0,
};

const wave = (seed: number, count = 28): number[] => {
  let x = seed;
  return Array.from({ length: count }, () => {
    x = (x * 9301 + 49297) % 233280;
    return 18 + Math.round((x / 233280) * 82);
  });
};

let counter = 0;
const id = () => `m${++counter}`;
export const react = (emoji: string, ...userIds: string[]): Reaction => ({ emoji, userIds });

export const text = (podId: string, authorId: string, minutesAgo: number, body: string, reactions: Reaction[] = []): Message => ({
  id: id(), podId, kind: "text", authorId, sentAt: ago(minutesAgo), text: body, reactions,
});
export const voice = (podId: string, authorId: string, minutesAgo: number, seconds: number, reactions: Reaction[] = []): Message => ({
  id: id(), podId, kind: "voice", authorId, sentAt: ago(minutesAgo), durationMs: seconds * 1000, waveform: wave(seconds * 7 + minutesAgo), reactions,
});
export const video = (podId: string, authorId: string, minutesAgo: number, seconds: number, reactions: Reaction[] = []): Message => ({
  id: id(), podId, kind: "video", authorId, sentAt: ago(minutesAgo), durationMs: seconds * 1000, reactions,
});
export const system = (podId: string, minutesAgo: number, body: string): Message => ({
  id: id(), podId, kind: "system", sentAt: ago(minutesAgo), text: body, reactions: [],
});

export const day = 24 * 60;

export const MESSAGES: Record<string, Message[]> = {
  "ship-launch": [
    system("ship-launch", 2 * day + 300, "Mira created the pod #launch"),
    text("ship-launch", "mira", 2 * day + 290, "Launch is Friday. Let's use this pod for everything until then."),
    text("ship-launch", "jonah", 2 * day + 285, "Pinning the checklist now.", [react("🙌", "mira", "tola", "leo")]),
    text("ship-launch", "tola", 2 * day + 240, "Landing page copy is done. Waiting on the pricing table."),
    text("ship-launch", "dee", day + 600, "Anyone tested the signup flow on Android yet?"),
    text("ship-launch", "noor", day + 590, "Tried it this morning. The keyboard covers the button on small screens."),
    text("ship-launch", "noor", day + 589, "Screenshot coming in the design pod."),
    text("ship-launch", ME_ID, day + 560, "On it. I'll fix the keyboard spacing today."),
    system("ship-launch", day + 400, "Sam joined the hub"),
    text("ship-launch", "mira", 190, "Morning all. Status check before the weekend push?"),
    voice("ship-launch", "jonah", 182, 14, [react("🔥", "mira", "tola", ME_ID, "leo")]),
    text("ship-launch", "tola", 170, "Love that plan. I'll take the email list."),
    text("ship-launch", "leo", 120, "Pricing table is up. Needs a second pair of eyes.", [react("👀", "mira", ME_ID)]),
    video("ship-launch", "dee", 95, 8, [react("😂", "jonah", "noor")]),
    text("ship-launch", "mira", 64, "That demo is exactly the tone I wanted for the launch video."),
    text("ship-launch", "jonah", 41, "Ship list for Friday:"),
    text("ship-launch", "jonah", 40, "1. Pricing page\n2. Signup on Android\n3. Launch email\n4. The video"),
    voice("ship-launch", "mira", 22, 31),
    text("ship-launch", "noor", 9, "Can someone review the signup copy before noon?"),
    text("ship-launch", "tola", 6, "Looking now."),
  ],
  "ship-announce": [
    text("ship-announce", "mira", 3 * day, "Welcome to Ship It. Weekly demo days are on Thursdays."),
    text("ship-announce", "jonah", 15, "Demo day moved to 5pm this week. Same link."),
  ],
  "ship-welcome": [
    text("ship-welcome", "mira", 5 * day, "Be kind, ship small, give feedback you would want to get."),
  ],
  "ship-general": [
    text("ship-general", "leo", 300, "Anyone else's coffee machine just give up?"),
    text("ship-general", "sam", 290, "Mine did last week. Swapped to a pour over and never looked back.", [react("☕", "leo", "noor")]),
  ],
  "ship-feedback": [
    text("ship-feedback", "priya", 80, "Dropped my onboarding mock in the thread. Be rough."),
    text("ship-feedback", "dee", 55, "Step 3 feels like two steps. Could the tooltip and the form merge?"),
  ],
  "design-crits": [
    text("design-crits", "tola", 7 * 60, "Crit night is Wednesday. Bring one thing you are unsure about."),
    video("design-crits", "priya", 4 * 60, 22, [react("😍", "tola", ME_ID, "zara")]),
    text("design-crits", "zara", 3 * 60 + 20, "The spacing on that card is so calm. What's the base unit?"),
    text("design-crits", "priya", 3 * 60 + 10, "4 and 8 only. Anything else gets deleted."),
    voice("design-crits", "ife", 40, 18),
    text("design-crits", "tola", 12, "Pushing the crit template to the pinned post."),
  ],
  "design-general": [text("design-general", "zara", 2 * day, "Happy Friday, designers.")],
  "run-plans": [
    text("run-plans", "kofi", day + 120, "Saturday 7am at the park gate. 10k easy pace."),
    text("run-plans", "noor", 120, "Count me in."),
    voice("run-plans", "leo", 50, 9),
  ],
  "run-general": [text("run-general", "sam", 3 * day, "New shoes arrived. Pink. No regrets.")],
  "book-current": [
    text("book-current", "zara", 2 * day, "Chapters 1 to 6 this week, please."),
    text("book-current", ME_ID, 2 * day - 30, "Halfway and I already want to argue with the narrator."),
  ],
  "book-next": [text("book-next", "priya", 4 * day, "Poll is open. Three finalists.")],
  "book-general": [text("book-general", "dee", 6 * day, "Hello from the new member.")],
};
