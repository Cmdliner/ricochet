import type { Metadata } from "next";
import Link from "next/link";
import { StoreCard } from "@/components/store-card";
import { STORES } from "@/lib/constants";
import { buttonClass } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Download",
  description: "Ricochet is coming to iOS and Android. Join the waitlist to be first in line.",
};

export default function Download() {
  return (
    <section className="mx-auto max-w-4xl px-5 py-20 text-center sm:px-8 sm:py-28">
      <h1 className="font-display text-5xl font-semibold tracking-[-0.04em] text-balance sm:text-6xl">
        Get Ricochet on your phone.
      </h1>
      <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted">
        Ricochet is on its way to iOS and Android. Join the waitlist and we will tell you the
        moment it lands in your app store.
      </p>

      <div className="mt-14 grid gap-5 text-left sm:grid-cols-2">
        {STORES.map((store) => (
          <StoreCard key={store.id} {...store} />
        ))}
      </div>

      <Link href="/#waitlist" className={`${buttonClass({ size: "lg" })} mt-12`}>
        Join the waitlist
      </Link>
    </section>
  );
}
