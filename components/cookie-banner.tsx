"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { COOKIE_EVENT, COOKIE_STORAGE_KEY } from "@/lib/constants";

let dismissedInMemory = false;

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(COOKIE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(COOKIE_EVENT, onChange);
  };
}

function getSnapshot() {
  if (dismissedInMemory) return true;
  try {
    return localStorage.getItem(COOKIE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

// Treat the server as "already dismissed" so the banner never flashes during SSR.
function getServerSnapshot() {
  return true;
}

export function CookieBanner() {
  const dismissed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (dismissed) return null;

  function dismiss() {
    dismissedInMemory = true;
    try {
      localStorage.setItem(COOKIE_STORAGE_KEY, "1");
    } catch {
      // Storage can be blocked; the in-memory flag still hides it this session.
    }
    window.dispatchEvent(new Event(COOKIE_EVENT));
  }

  return (
    <div
      role="region"
      aria-label="Cookie notice"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 px-4"
    >
      <div className="pointer-events-auto mx-auto flex w-full max-w-xl flex-col gap-4 rounded-2xl border border-line bg-[#0e0e0e]/95 p-4 shadow-2xl shadow-black backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-3 sm:pr-3 sm:pl-6">
        <p className="text-sm leading-relaxed text-muted">
          By using this website you agree to our{" "}
          <Link href="/cookies" className="text-ink underline underline-offset-4">
            cookie policy
          </Link>
          .
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="sheen h-11 shrink-0 rounded-full bg-accent px-7 text-sm font-semibold text-accent-ink transition hover:brightness-110"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
