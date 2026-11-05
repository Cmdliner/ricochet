"use client";

import { useState } from "react";
import { Container } from "@/components/container";
import { LogoMark } from "@/components/logo";
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
    <section id="waitlist" className="py-24 sm:py-32">
      <Container>
        <div className="relative overflow-hidden rounded-[2rem] bg-accent px-6 py-16 text-center text-accent-ink sm:px-12 sm:py-24">
          <LogoMark inverse className="mx-auto size-14" />
          <h2 className="mx-auto mt-8 max-w-2xl font-display text-4xl font-semibold tracking-[-0.03em] text-balance sm:text-5xl">
            Be first through the door.
          </h2>
          <p className="mx-auto mt-5 max-w-md text-lg leading-relaxed text-accent-ink/75">
            Leave your email and we will let you know the moment Ricochet is ready.
          </p>

          {status === "done" ? (
            <p role="status" className="mx-auto mt-10 max-w-md rounded-2xl bg-black px-5 py-4 text-ink">
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
                className="h-12 flex-1 rounded-full bg-white px-5 text-black placeholder:text-black/45 focus:outline-2 focus:outline-black aria-[invalid=true]:outline-2 aria-[invalid=true]:outline-[#b91c1c]"
              />
              <button type="submit" className={buttonClass({ variant: "dark", size: "lg" })}>
                Notify me
              </button>
            </form>
          )}
          {status === "invalid" && (
            <p id="email-error" role="alert" className="mt-3 text-sm font-medium text-[#991b1b]">
              That email does not look right. Mind checking it?
            </p>
          )}
        </div>
      </Container>
    </section>
  );
}
