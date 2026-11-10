import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/container";
import { ChatPhone } from "@/components/phone-mockups";
import { StoreBadge } from "@/components/store-badge";
import { buttonClass } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Download",
  description: "Ricochet is coming to iOS and Android. Join the waitlist to be first in line.",
};

export default function Download() {
  return (
    <section className="relative overflow-hidden pt-12 pb-16 sm:pt-28 sm:pb-24">
      <Container className="grid items-center gap-16 lg:grid-cols-2">
        <div className="text-center lg:text-left">
          <p className="inline-flex rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-ink">
            Coming soon
          </p>
          <h1 className="mt-6 font-display text-5xl leading-[1.02] font-semibold tracking-[-0.04em] text-balance sm:text-6xl">
            Get Ricochet on your phone.
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-muted lg:mx-0">
            Ricochet is on its way to iOS and Android. Join the waitlist and we will tell
            you the moment it lands in your app store.
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
  );
}
