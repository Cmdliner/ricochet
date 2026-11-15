import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { Container } from "@/components/container";
import { MicIcon, PlayIcon } from "@/components/icons";
import { ChatPhone } from "@/components/phone-mockups";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import { StoreBadge } from "@/components/store-badge";
import { Waveform } from "@/components/waveform";
import { AVATAR_COLORS } from "@/lib/constants";
import { buttonClass } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Download",
  description: "Ricochet is coming to iOS and Android. Join the waitlist to be first in line.",
};

const highlights = [
  {
    title: "Hubs and pods",
    body: "A home for your community, split into rooms. Keep some rooms private, and see unread counts at a glance.",
  },
  {
    title: "Voice and video notes",
    body: "Hold to record a voice note, or send a round video note up to a minute long. Both play right in the chat.",
  },
  {
    title: "Private chats",
    body: "Find someone by their handle and talk one to one. Block or report anyone, and they are never told.",
  },
];

const questions = [
  {
    q: "How do I sign in?",
    a: "Enter your email and we send you a code. There is no password to remember, though you can add one later in your profile if you prefer.",
  },
  {
    q: "Which phones is it for?",
    a: "Android first, then iOS. Join the waitlist and we will tell you when each one is ready.",
  },
  {
    q: "Is there group chat?",
    a: "Communities live in hubs, which are split into pods for each topic. One to one conversations are private chats.",
  },
  {
    q: "What happens when someone bothers me?",
    a: "Block them and their messages disappear from your view, without them being told. Report a message and it is sent to us for review.",
  },
  {
    q: "Can I use it on my computer?",
    a: "Not yet. The phone app is the first release.",
  },
];

function PhotoChip({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      aria-hidden="true"
      className={`absolute flex items-center gap-2.5 rounded-full bg-canvas/85 py-1.5 pr-3.5 pl-1.5 text-xs font-semibold shadow-xl shadow-black/40 backdrop-blur ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

export default function Download() {
  return (
    <>
      <section className="relative overflow-hidden pt-20 pb-24 sm:pt-28">
        <Image src="/photos/bg-couch.webp" alt="" fill priority sizes="100vw" className="object-cover opacity-25" />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-canvas via-canvas/70 to-canvas" />
        <Container className="relative grid items-center gap-16 lg:grid-cols-2">
          <div className="text-center lg:text-left">
            <p className="inline-flex rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-ink">Coming soon</p>
            <h1 className="mt-6 font-display text-5xl leading-[1.02] font-semibold tracking-[-0.04em] text-balance sm:text-6xl">
              Get Ricochet on your phone.
            </h1>
            <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-muted lg:mx-0">
              Ricochet is on its way to iOS and Android. Join the waitlist and we will tell you the moment it lands in
              your app store.
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
              <StoreBadge store="ios" size="lg" />
              <StoreBadge store="android" size="lg" />
            </div>

            <Link href="/#waitlist" className={`${buttonClass({ size: "lg" })} sheen mt-10`}>
              Join the waitlist
            </Link>
          </div>

          <div className="relative mx-auto h-[540px] overflow-hidden">
            <ChatPhone />
          </div>
        </Container>
      </section>

      <section className="bg-canvas py-16 sm:py-24">
        <Container className="grid items-center gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <Reveal className="relative mx-auto w-full max-w-[17rem]">
            <div className="h-[30rem] overflow-hidden rounded-t-[9%/4%] shadow-2xl shadow-black/60 ring-1 ring-line">
              <Image
                src="/photos/app-chats.webp"
                alt="The Chats screen of the Ricochet app"
                width={540}
                height={1200}
                className="w-full"
              />
            </div>
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-canvas to-transparent" aria-hidden="true" />
          </Reveal>

          <Reveal delay={100}>
            <p className="text-sm font-semibold text-accent">What you get</p>
            <h2 className="mt-2 font-display text-[1.85rem] leading-[1.08] font-semibold tracking-[-0.03em] text-balance sm:mt-3 sm:text-5xl">
              Everything fits in your pocket.
            </h2>
            <ul className="mt-8 flex flex-col gap-6">
              {highlights.map((item, index) => (
                <li key={item.title} className="flex items-start gap-5">
                  <span className="w-8 shrink-0 font-display text-3xl leading-none font-semibold text-transparent [-webkit-text-stroke:1.5px_var(--accent)]">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-display text-xl font-semibold tracking-tight">{item.title}</h3>
                    <p className="mt-1 max-w-md text-muted">{item.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
        </Container>
      </section>

      <section className="bg-cream py-16 text-cream-ink sm:py-24">
        <Container>
          <Reveal>
            <SectionHeading
              tone="light"
              eyebrow="Made for talking"
              title="Voices, faces and the people behind them."
              body="Ricochet is built around the moments text cannot carry: a laugh, a quick hello, a story told out loud."
            />
          </Reveal>
          <Reveal delay={100}>
            <div className="mt-8 grid gap-3 sm:mt-12 sm:grid-cols-3 sm:gap-4">
              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl sm:aspect-auto sm:min-h-[22rem]">
                <Image src="/photos/band-selfie.webp" alt="" fill sizes="(min-width: 640px) 33vw, 100vw" className="object-cover" />
                <PhotoChip className="bottom-4 left-4">
                  <Avatar letter="M" color={AVATAR_COLORS.coral} size="sm" />
                  <span className="text-ink">sending a video note</span>
                </PhotoChip>
              </div>
              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl sm:aspect-auto sm:min-h-[22rem]">
                <Image src="/photos/band-peace.webp" alt="" fill sizes="(min-width: 640px) 33vw, 100vw" className="object-cover" />
                <PhotoChip className="top-4 right-4">
                  <span className="grid size-7 place-items-center rounded-full bg-accent text-accent-ink">
                    <PlayIcon className="size-3 translate-x-px" />
                  </span>
                  <Waveform count={9} progress={55} />
                  <span className="text-ink tabular-nums">0:14</span>
                </PhotoChip>
              </div>
              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl sm:aspect-auto sm:min-h-[22rem]">
                <Image src="/photos/bg-couch.webp" alt="" fill sizes="(min-width: 640px) 33vw, 100vw" className="object-cover" />
                <PhotoChip className="bottom-4 left-4 bg-accent! text-accent-ink">
                  <span className="grid size-7 place-items-center rounded-full bg-accent-ink text-accent">
                    <MicIcon className="size-3.5" />
                  </span>
                  hold to record
                </PhotoChip>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      <section className="bg-canvas py-16 sm:py-24">
        <Container className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <Reveal>
            <p className="text-sm font-semibold text-accent">Questions</p>
            <h2 className="mt-2 font-display text-[1.85rem] leading-[1.08] font-semibold tracking-[-0.03em] text-balance sm:mt-3 sm:text-5xl">
              Before you install.
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <div className="divide-y divide-line border-y border-line">
              {questions.map((item) => (
                <details key={item.q} className="group py-5">
                  <summary className="flex list-none items-center justify-between gap-6 font-display text-lg font-semibold tracking-tight [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <span aria-hidden="true" className="text-2xl leading-none text-accent transition group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 max-w-xl leading-relaxed text-muted">{item.a}</p>
                </details>
              ))}
            </div>
          </Reveal>
        </Container>
      </section>

      <section className="bg-canvas pb-20 sm:pb-28">
        <Container>
          <div className="relative overflow-hidden rounded-[2rem] bg-accent px-6 py-12 text-center text-accent-ink sm:px-12 sm:py-16">
            <Image
              src="/photos/bg-friends.webp"
              alt=""
              fill
              sizes="(min-width: 1152px) 1100px, 100vw"
              className="object-cover opacity-40 mix-blend-multiply grayscale"
            />
            <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--accent)_30%,transparent_85%)]" />
            <div className="relative">
              <h2 className="mx-auto max-w-xl font-display text-3xl font-semibold tracking-[-0.03em] text-balance sm:text-5xl">
                Be first through the door.
              </h2>
              <p className="mx-auto mt-3 max-w-md text-base text-accent-ink/80 sm:text-lg">
                Leave your email and we will let you know the moment Ricochet is ready.
              </p>
              <Link href="/#waitlist" className={`${buttonClass({ variant: "dark", size: "lg" })} sheen mt-7`}>
                Join the waitlist
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
