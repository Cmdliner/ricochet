"use client";

import { useState } from "react";
import { buttonClass, isValidEmail } from "@/lib/utils";

export function Waitlist() {
  const [status, setStatus] = useState<"idle" | "invalid" | "done">("idle");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "");
    if (!isValidEmail(email)) {
      setStatus("invalid");
      return;
    }
    // TODO: send `email` to the waitlist backend once one exists.
    setStatus("done");
  }

  return (
    <section id="waitlist" className="mx-auto max-w-6xl px-5 pb-24 sm:px-8 sm:pb-32">
      <div className="rounded-3xl border border-line bg-surface px-6 py-16 text-center sm:px-12 sm:py-24">
        <h2 className="mx-auto max-w-2xl font-display text-4xl font-semibold tracking-[-0.03em] text-balance sm:text-5xl">
          Be first through the door.
        </h2>
        <p className="mx-auto mt-5 max-w-md text-lg leading-relaxed text-muted">
          Leave your email and we will let you know the moment Ricochet is ready.
        </p>

        {status === "done" ? (
          <p
            role="status"
            className="mx-auto mt-10 max-w-md rounded-2xl border border-line bg-raised px-5 py-4"
          >
            You are on the list. Talk soon.
          </p>
        ) : (
          <form
            onSubmit={onSubmit}
            noValidate
            className="mx-auto mt-10 flex max-w-md flex-col gap-3 sm:flex-row"
          >
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={status === "invalid"}
              aria-describedby={status === "invalid" ? "email-error" : undefined}
              className="h-12 flex-1 rounded-full border border-line bg-black px-5 placeholder:text-muted/60 focus:border-white/60 focus:outline-none aria-[invalid=true]:border-[#f87171]"
            />
            <button type="submit" className={buttonClass({ size: "lg" })}>
              Notify me
            </button>
          </form>
        )}
        {status === "invalid" && (
          <p id="email-error" role="alert" className="mt-3 text-sm text-[#f87171]">
            That email does not look right. Mind checking it?
          </p>
        )}
      </div>
    </section>
  );
}
