import { day, react, system, text, video, voice } from "./mock-data";
import { ME_ID, type Chat, type Message } from "./types";

/** Mock private chats. Each chat id doubles as the "pod id" its messages are stored under. */

export const CHATS: Chat[] = [
  { id: "dm-mira", personId: "mira", pinned: true, muted: false },
  { id: "dm-jonah", personId: "jonah", pinned: true, muted: false },
  { id: "dm-tola", personId: "tola", pinned: false, muted: false },
  { id: "dm-priya", personId: "priya", pinned: false, muted: false },
  { id: "dm-dee", personId: "dee", pinned: false, muted: true },
  { id: "dm-noor", personId: "noor", pinned: false, muted: false },
  { id: "dm-kofi", personId: "kofi", pinned: false, muted: false },
];

export const CHAT_UNREAD: Record<string, number> = {
  "dm-mira": 2,
  "dm-tola": 1,
  "dm-priya": 4,
  "dm-dee": 3,
};

export const CHAT_MESSAGES: Record<string, Message[]> = {
  "dm-mira": [
    system("dm-mira", 3 * day, "You and Mira are now connected"),
    text("dm-mira", "mira", 3 * day - 20, "Hey! Saw your note in #launch. Want to pair on the pricing page tomorrow?"),
    text("dm-mira", ME_ID, 3 * day - 35, "Yes please. Mornings are best for me."),
    text("dm-mira", "mira", 2 * day + 90, "Perfect, 9am then.", [react("👍", ME_ID)]),
    voice("dm-mira", ME_ID, 2 * day + 80, 23),
    text("dm-mira", "mira", 2 * day + 70, "Ha, that made my morning. See you there."),
    text("dm-mira", ME_ID, 180, "Running 10 minutes late, sorry!"),
    text("dm-mira", "mira", 42, "No stress, grabbing coffee."),
    voice("dm-mira", "mira", 8, 31),
    text("dm-mira", "mira", 7, "Also, found a fun bug in the checkout. Voice note above."),
  ],
  "dm-jonah": [
    text("dm-jonah", "jonah", day + 240, "Can you review the PR before lunch?"),
    text("dm-jonah", ME_ID, day + 215, "On it."),
    text("dm-jonah", ME_ID, day + 160, "Left a few comments. Mostly naming nits, the logic is solid.", [react("🙌", "jonah")]),
    text("dm-jonah", "jonah", day + 150, "You are a legend. Merging now."),
    video("dm-jonah", ME_ID, 600, 14),
    text("dm-jonah", "jonah", 590, "Haha that demo is great, sending it to the team."),
  ],
  "dm-tola": [
    text("dm-tola", ME_ID, 2 * day, "Do you have the Figma link for the onboarding flow?"),
    text("dm-tola", "tola", 2 * day - 30, "Sure, one sec."),
    text("dm-tola", "tola", 2 * day - 32, "figma.com/file/onboarding-v3"),
    text("dm-tola", ME_ID, 2 * day - 50, "Got it, thank you!"),
    voice("dm-tola", "tola", 95, 18),
  ],
  "dm-priya": [
    text("dm-priya", "priya", 600, "Are you coming to the crit on Thursday?"),
    text("dm-priya", "priya", 598, "I am bringing the new icon set."),
    video("dm-priya", "priya", 300, 22),
    text("dm-priya", "priya", 120, "Also, can I borrow your moodboard from last week?"),
    text("dm-priya", "priya", 118, "No rush!"),
  ],
  "dm-dee": [
    text("dm-dee", ME_ID, 4 * day, "Happy birthday Dee! 🎉"),
    text("dm-dee", "dee", 4 * day - 120, "Thank you!! Dinner on Saturday?"),
    text("dm-dee", "dee", 5 * 60, "Booked the table for 7."),
    text("dm-dee", "dee", 5 * 60 - 1, "Bring snacks."),
    text("dm-dee", "dee", 5 * 60 - 3, "Kidding. Mostly."),
  ],
  "dm-noor": [
    voice("dm-noor", "noor", 6 * day, 41),
    text("dm-noor", ME_ID, 6 * day - 30, "Listened twice, so good. Send me the stems?"),
    text("dm-noor", "noor", 6 * day - 90, "Will do tonight."),
    text("dm-noor", "noor", 5 * day, "Sent! Check your inbox."),
    text("dm-noor", ME_ID, 5 * day - 20, "Got them, thanks Noor.", [react("❤️", "noor")]),
  ],
  "dm-kofi": [
    text("dm-kofi", ME_ID, 9 * day, "Great meeting you at the meetup!"),
    text("dm-kofi", "kofi", 9 * day - 200, "Likewise. Let's catch up soon."),
  ],
};

