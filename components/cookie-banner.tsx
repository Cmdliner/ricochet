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
      className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-[600px] flex-col gap-3 rounded-3xl border border-line bg-[#0f0f0f] p-4 shadow-2xl shadow-black sm:flex-row sm:items-center sm:gap-5 sm:rounded-full sm:py-2.5 sm:pr-2.5 sm:pl-6"
    >
      <p className="text-sm text-muted">
        By using this website you agree to our{" "}
        <Link href="/cookies" className="text-ink underline underline-offset-4">
          cookie policy
        </Link>
        .
      </p>
      <button
        type="button"
        onClick={dismiss}
        className="h-10 shrink-0 rounded-full bg-raised px-5 text-sm font-medium transition-colors hover:bg-line"
      >
        Dismiss
      </button>
    </div>
  );
}
