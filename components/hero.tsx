import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import { PhoneMockups } from "@/components/phone-mockups";
import { SITE } from "@/lib/constants";
import { buttonClass } from "@/lib/utils";

export function Hero() {
  return (
    <section className="border-b border-line">
      <div className="mx-auto max-w-4xl px-5 pt-20 text-center sm:px-8 sm:pt-28">
        <Link
          href="/#waitlist"
          className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-1.5 text-sm text-muted transition-colors hover:text-ink"
        >
          Early access opens soon
          <ArrowRightIcon className="size-3.5" />
        </Link>

        <h1 className="mt-8 font-display text-[2.9rem] leading-[1.02] font-semibold tracking-[-0.04em] text-balance sm:text-7xl">
          {SITE.tagline}
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-pretty text-muted">
          Ricochet is real-time messaging with hubs for your communities and private
          chats for everyone else. Send a voice message, drop a video note, keep the
          thread moving.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/#waitlist" className={buttonClass({ size: "lg" })}>
            Join the waitlist
          </Link>
          <Link href="/#features" className={buttonClass({ variant: "secondary", size: "lg" })}>
            See what&apos;s inside
          </Link>
        </div>
      </div>

      <div className="mt-16 sm:mt-20">
        <PhoneMockups />
      </div>
    </section>
  );
}
