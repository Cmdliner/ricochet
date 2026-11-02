import { SITE } from "@/lib/constants";
import type { LegalContent } from "./types";

export const cookies: LegalContent = {
  title: "Cookie Policy",
  description: "How the Ricochet website uses cookies and browser storage.",
  updated: "November 2, 2026",
  intro:
    "This policy explains how the Ricochet website uses cookies and similar technologies such as local storage. We keep this to the minimum needed to make the site work.",
  sections: [
    {
      heading: "What we use",
      paragraphs: [
        "We do not use advertising, tracking or analytics cookies, and we do not share data with ad networks.",
        "The only item we store in your browser is a small flag, kept in local storage, that records that you dismissed the cookie notice so we do not show it again. It stays on your device and is not sent to us.",
      ],
    },
    {
      heading: "Managing storage",
      paragraphs: [
        "You can clear or block local storage and cookies in your browser settings. If you do, the cookie notice may appear again on your next visit.",
      ],
    },
    {
      heading: "Changes",
      paragraphs: [
        "If we add analytics or other non-essential technologies, we will update this page and ask for your consent where the law requires it.",
      ],
    },
    {
      heading: "Contact us",
      paragraphs: [`Questions? Email us at ${SITE.contactEmail}.`],
    },
  ],
};
