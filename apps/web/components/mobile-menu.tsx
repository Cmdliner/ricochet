"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowRightIcon, CloseIcon } from "@/components/icons";
import { Wordmark } from "@/components/logo";
import { StoreBadge } from "@/components/store-badge";
import { NAV_LINKS } from "@/lib/constants";
import { buttonClass } from "@/lib/utils";

export function MobileMenu({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      id="mobile-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      className="menu-in fixed inset-0 z-50 flex flex-col overflow-y-auto bg-canvas md:hidden"
    >
      <div className="flex h-16 shrink-0 items-center justify-between px-5 sm:px-8">
        <Link href="/" aria-label="Ricochet home" onClick={onClose}>
          <Wordmark className="text-[1.7rem]" />
        </Link>
        <button
          type="button"
          aria-label="Close menu"
          onClick={onClose}
          className="grid size-10 place-items-center rounded-full bg-raised transition-colors hover:bg-line"
        >
          <CloseIcon className="size-5" />
        </button>
      </div>

      <nav aria-label="Mobile" className="flex flex-1 flex-col justify-center gap-3 px-5 py-6 sm:px-8">
        {NAV_LINKS.map((link, index) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClose}
            style={{ animationDelay: `${index * 70 + 80}ms` }}
            className="fade-up group flex items-center justify-between gap-4 rounded-3xl border border-line bg-surface/90 p-5 transition-colors active:bg-raised"
          >
            <span>
              <span className="block font-display text-[1.65rem] leading-tight font-semibold tracking-tight">
                {link.label}
              </span>
              <span className="mt-1 block text-sm text-muted">{link.description}</span>
            </span>
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-accent-ink transition-transform group-active:translate-x-0.5">
              <ArrowRightIcon className="size-5" />
            </span>
          </Link>
        ))}
      </nav>

      <div className="shrink-0 space-y-5 px-5 pb-8 sm:px-8">
        <Link href="/#waitlist" onClick={onClose} className={`${buttonClass({ size: "lg" })} sheen w-full`}>
          Join the waitlist
        </Link>
        <div className="flex flex-wrap justify-center gap-3">
          <StoreBadge store="ios" />
          <StoreBadge store="android" />
        </div>
      </div>
    </div>
  );
}
