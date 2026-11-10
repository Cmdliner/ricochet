import { SITE } from "@/lib/constants";
import type { LegalContent } from "./types";

export const privacy: LegalContent = {
  title: "Privacy Policy",
  description: "How Ricochet collects, uses and protects your personal information.",
  updated: "November 10, 2026",
  intro:
    "This Privacy Policy explains what personal information Ricochet (\"we\", \"us\") collects when you visit our website, join our waitlist or use our apps, how we use it, and the choices you have. We aim to collect only what we need to run Ricochet well.",
  sections: [
    {
      heading: "Information we collect",
      paragraphs: ["Depending on how you use Ricochet, we may collect:"],
      list: [
        "Waitlist information: your email address when you ask to be notified about launch.",
        "Account information: your email address, display name and handle, and optionally a profile picture, a short bio and a status. If you choose to set a password it is stored only as a salted hash; signing in with an emailed code needs no password.",
        "Content you send: messages, reactions, voice notes and video notes, plus the details needed to deliver them, such as who they are sent to, timestamps and read states.",
        "Hub and pod information: the hubs and pods you create or join, and your role in them.",
        "Device and usage information: device type, operating system, app version, IP address and technical logs, used to keep the Service running and secure. If you turn on notifications we also keep a push notification token for your device. The Ricochet app does not contain advertising or third-party analytics tools.",
        "Safety information: the people you block, and reports you send. A report keeps a copy of the reported message text so it can be reviewed even if the message is later removed. The person you block or report is not told.",
        "Support information: anything you tell us when you contact us.",
      ],
    },
    {
      heading: "How we use your information",
      list: [
        "to provide, operate and maintain Ricochet, including delivering messages in real time;",
        "to create and manage your account and authenticate you;",
        "to notify you about launch, updates and important service messages;",
        "to keep the Service safe, detect abuse, spam and fraud, and enforce our Terms;",
        "to fix bugs, measure performance and improve features; and",
        "to comply with legal obligations and respond to lawful requests.",
      ],
      paragraphs: ["We do not sell your personal information, and we do not use the content of your private messages for advertising."],
    },
    {
      heading: "Our legal bases (EEA, UK)",
      paragraphs: [
        "Where data protection law such as the GDPR applies, we rely on: performance of a contract (to provide the Service you asked for), legitimate interests (to secure and improve the Service, provided your rights do not override them), consent (for example, for marketing emails or optional permissions such as the microphone and camera), and legal obligation.",
      ],
    },
    {
      heading: "Microphone, camera and other permissions",
      paragraphs: [
        "Voice messages and video notes require access to your microphone and camera. We ask for these permissions only when you use those features, and you can withdraw them at any time in your device settings. Recordings are used to deliver what you choose to send.",
      ],
    },
    {
      heading: "Who we share information with",
      paragraphs: ["We share personal information only as needed:"],
      list: [
        "with other people you communicate with, such as members of a hub or pod, or the recipient of a private chat;",
        "with service providers who process data for us under contract, such as hosting, storage, email delivery, analytics and crash reporting, and who may use it only to provide services to us;",
        "with authorities or other parties where required by law or to protect rights, safety and security; and",
        "in connection with a merger, acquisition or sale of assets, in which case we will tell you and any new owner must honour this policy.",
      ],
    },
    {
      heading: "International transfers",
      paragraphs: [
        "We and our providers may process information in countries other than your own. Where required, we use safeguards such as standard contractual clauses to protect information transferred out of the EEA or UK.",
      ],
    },
    {
      heading: "How long we keep information",
      paragraphs: [
        "We keep information only as long as needed for the purposes described here. Waitlist emails are kept until launch communications are complete or you unsubscribe. Account data is kept while your account is active and deleted or anonymised within a reasonable period after you close it. Content you delete is removed from our active systems, and from backups within a limited retention window, unless we must keep it to comply with law or resolve disputes.",
      ],
    },
    {
      heading: "Security",
      paragraphs: [
        "We use technical and organisational measures such as encryption in transit, access controls and monitoring to protect your information. No system is completely secure, so we cannot guarantee absolute security. Please use a strong, unique password and keep your devices up to date.",
      ],
    },
    {
      heading: "Your rights and choices",
      paragraphs: [
        "Depending on where you live, you may have the right to access, correct, delete or export your personal information, to object to or restrict certain processing, to withdraw consent at any time, and to complain to your local data protection authority. California residents have the right to know, delete and correct personal information and to not be discriminated against for exercising these rights. We do not sell or share personal information for cross-context behavioural advertising.",
        `To exercise your rights, email ${SITE.contactEmail}. We may need to verify your identity before acting on a request.`,
      ],
    },
    {
      heading: "Children",
      paragraphs: [
        "Ricochet is not directed to children under 13 (or the higher age of digital consent in your country). We do not knowingly collect personal information from them. If you believe a child has given us information, contact us and we will delete it.",
      ],
    },
    {
      heading: "Cookies and similar technologies",
      paragraphs: ["Our Cookie Policy explains how this website uses browser storage."],
    },
    {
      heading: "Changes to this policy",
      paragraphs: [
        "We may update this policy as Ricochet evolves. We will post the new version here with a new date and, for material changes, give you reasonable notice.",
      ],
    },
    {
      heading: "Contact us",
      paragraphs: [`Questions or concerns about privacy? Email us at ${SITE.contactEmail}.`],
    },
  ],
};
