import { SITE } from "@/lib/constants";
import type { LegalContent } from "./types";

export const terms: LegalContent = {
  title: "Terms of Service",
  description: "The rules for using Ricochet, its website and its apps.",
  updated: "November 2, 2026",
  intro:
    "These Terms of Service form a binding agreement between you and Ricochet (\"Ricochet\", \"we\", \"us\"). They apply to our website, our mobile apps and any related services (together, the \"Service\"). By accessing or using the Service you agree to these Terms. If you do not agree, do not use the Service.",
  sections: [
    {
      heading: "Who can use Ricochet",
      paragraphs: [
        "You must be at least 13 years old, or older if the age of digital consent in your country is higher, to use the Service. If you are under the age of majority where you live, you may use the Service only with the permission of a parent or legal guardian who agrees to these Terms on your behalf.",
        "You must not use the Service if you have been previously banned from it, or if the law of your country prohibits you from doing so.",
      ],
    },
    {
      heading: "Your account",
      paragraphs: [
        "To use most features you will need an account. You agree to provide accurate information, keep your login details secure, and tell us promptly if you suspect unauthorized access. You are responsible for everything that happens under your account.",
        "You may not sell, transfer or share your account, or create accounts by automated means.",
      ],
    },
    {
      heading: "Hubs, pods and private chats",
      paragraphs: [
        "Ricochet lets you create and join hubs, which contain pods (topic channels), and exchange private messages. People who create a hub are responsible for how it is run and for setting rules for their community, within these Terms.",
        "Hub owners and moderators may remove content and members from their hubs. We are not responsible for the decisions of hub owners or the conduct of other members, but we may act on reports as described below.",
      ],
    },
    {
      heading: "Your content",
      paragraphs: [
        "You keep ownership of everything you send through the Service, including text, voice messages, video notes, images and files (\"Your Content\"). You are responsible for Your Content and for having the rights needed to share it.",
        "To run the Service, you grant us a worldwide, non-exclusive, royalty-free licence to host, store, transmit, process and display Your Content, solely for the purpose of operating, securing and improving the Service and delivering it to the people you choose to share it with. This licence ends when Your Content is deleted from our systems, except where it has already been shared with others who have not deleted it, or where we must retain it by law.",
      ],
    },
    {
      heading: "Voice and video",
      paragraphs: [
        "Voice messages and video notes record sound and images of people. Before you record or send them, make sure everyone who appears or can be heard has agreed, and that recording them is lawful where you are. You must not record or share another person's voice or image in a way that violates their rights or privacy.",
      ],
    },
    {
      heading: "Acceptable use",
      paragraphs: ["You agree not to use the Service to:"],
      list: [
        "break the law or encourage others to do so;",
        "harass, threaten, bully, stalk or abuse anyone, or promote hatred or violence against people or groups;",
        "share sexual content involving minors, or any content that exploits or endangers children;",
        "share non-consensual intimate imagery, or content that reveals private information about others without permission;",
        "send spam, scams, phishing or malicious software, or impersonate any person or organisation;",
        "infringe the intellectual property or other rights of others;",
        "attempt to access accounts or data that are not yours, probe or disrupt our systems, or bypass security or rate limits;",
        "scrape, reverse engineer or copy the Service, except as the law permits; or",
        "use the Service to build or train a competing product.",
      ],
    },
    {
      heading: "Reports and enforcement",
      paragraphs: [
        "We may review reported content and, where we believe these Terms have been breached or harm is likely, remove content, restrict features, suspend or close accounts, and report matters to the authorities. We try to act proportionately and, where reasonable, to tell you why, but we are not obliged to monitor the Service and may act without notice where needed to protect people or the Service.",
      ],
    },
    {
      heading: "Our rights",
      paragraphs: [
        "The Service, including its software, design, logos, name and documentation, belongs to Ricochet or its licensors and is protected by intellectual property laws. We grant you a limited, personal, revocable, non-transferable licence to use the apps and website for their intended purpose. All rights not expressly granted are reserved.",
        "If you send us feedback or suggestions, we may use them without obligation to you.",
      ],
    },
    {
      heading: "Third-party services",
      paragraphs: [
        "The Service may link to or work with third-party services, including the Apple App Store and Google Play. Those services are governed by their own terms, and we are not responsible for them. Your use of an app store is subject to that store's terms.",
      ],
    },
    {
      heading: "Early access and changes to the Service",
      paragraphs: [
        "Ricochet is under development. Features, availability and pricing may change, and early access or beta features are provided as is and may be changed, limited or withdrawn at any time. Joining a waitlist does not guarantee access to the Service.",
      ],
    },
    {
      heading: "Privacy",
      paragraphs: [
        "Our Privacy Policy explains how we collect and use personal information, and forms part of these Terms.",
      ],
    },
    {
      heading: "Suspension and termination",
      paragraphs: [
        "You can stop using the Service and delete your account at any time. We may suspend or terminate your access if you breach these Terms, if required by law, or if we discontinue the Service. When your account is closed, your right to use the Service ends immediately. Sections that by their nature should survive termination, including those on content, intellectual property, disclaimers, liability and governing law, will continue to apply.",
      ],
    },
    {
      heading: "Disclaimers",
      paragraphs: [
        "The Service is provided \"as is\" and \"as available\". To the fullest extent permitted by law, we disclaim all warranties, express or implied, including merchantability, fitness for a particular purpose, non-infringement, and any warranty that the Service will be uninterrupted, secure or error-free. We do not guarantee that messages will always be delivered, stored or available, so please keep your own copies of anything important.",
      ],
    },
    {
      heading: "Limitation of liability",
      paragraphs: [
        "To the fullest extent permitted by law, Ricochet and its team, contributors, licensors and suppliers will not be liable for any indirect, incidental, special, consequential or punitive damages, or for loss of profits, data, goodwill or other intangible losses, arising from your use of the Service. Our total liability for any claim relating to the Service is limited to the greater of the amount you paid us in the 12 months before the claim arose, or fifty US dollars.",
        "Nothing in these Terms excludes or limits liability that cannot be excluded or limited by law, including liability for death or personal injury caused by negligence, or for fraud.",
      ],
    },
    {
      heading: "Indemnity",
      paragraphs: [
        "You agree to indemnify and hold harmless Ricochet and its team from claims, losses and expenses (including reasonable legal fees) arising from Your Content, your breach of these Terms, or your violation of any law or the rights of another person, except to the extent caused by us.",
      ],
    },
    {
      heading: "Changes to these Terms",
      paragraphs: [
        "We may update these Terms from time to time. If a change is material we will give you reasonable notice, for example by email or in the app, before it takes effect. By continuing to use the Service after the change takes effect you accept the updated Terms.",
      ],
    },
    {
      heading: "Governing law and disputes",
      paragraphs: [
        "These Terms are governed by the laws of the jurisdiction in which Ricochet is established, without regard to conflict of law rules, and the courts of that jurisdiction will have exclusive jurisdiction over disputes, except where mandatory consumer protection law in your country of residence gives you the right to bring a claim elsewhere. Before starting formal proceedings, please contact us so we can try to resolve the issue informally.",
      ],
    },
    {
      heading: "General",
      paragraphs: [
        "These Terms, together with the Privacy Policy, are the entire agreement between you and us about the Service. If any part is found unenforceable, the rest remains in effect. Our failure to enforce a provision is not a waiver. You may not assign these Terms without our consent; we may assign them as part of a merger, acquisition or sale of assets.",
      ],
    },
    {
      heading: "Contact us",
      paragraphs: [`Questions about these Terms? Email us at ${SITE.contactEmail}.`],
    },
  ],
};
