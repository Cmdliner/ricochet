"use client";

import { useState } from "react";
import {
  HubPreview,
  PrivatePreview,
  RealTimePreview,
  VideoPreview,
  VoicePreview,
} from "@/components/feature-previews";
import { cn } from "@/lib/utils";

const items = [
  {
    id: "hubs",
    title: "Hubs and pods",
    body: "A hub is a home for your people. Split it into pods so every topic gets its own room, with unread counts to show you where to look.",
    Preview: HubPreview,
  },
  {
    id: "voice",
    title: "Voice messages",
    body: "Say it the way you would out loud. Record, preview and send in a tap, then listen back at your own pace.",
    Preview: VoicePreview,
  },
  {
    id: "video",
    title: "Video notes",
    body: "Short, round and personal. For when text is too flat and a call is too much.",
    Preview: VideoPreview,
  },
  {
    id: "private",
    title: "Private chats",
    body: "Step out of the hub into a one-to-one conversation without ever leaving the app.",
    Preview: PrivatePreview,
  },
  {
    id: "realtime",
    title: "Real time, always",
    body: "Messages land the moment they are sent, with typing and read states that keep up.",
    Preview: RealTimePreview,
  },
] as const;

export function FeatureShowcase() {
  const [active, setActive] = useState(0);
  const { id, Preview } = items[active];

  return (
    <div className="grid items-stretch gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-8">
      <div className="flex flex-col gap-2" role="group" aria-label="Features">
        {items.map((item, index) => {
          const selected = index === active;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setActive(index)}
              className={cn(
                "group rounded-2xl border p-5 text-left transition-all",
                selected
                  ? "border-cream-line bg-cream-card shadow-sm"
                  : "border-transparent hover:bg-cream-card/60",
              )}
            >
              <span className="flex items-center gap-4">
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-full text-sm font-semibold transition-colors",
                    selected
                      ? "bg-accent text-accent-ink"
                      : "bg-cream-line text-cream-muted group-hover:bg-accent/30",
                  )}
                >
                  {index + 1}
                </span>
                <span className="font-display text-xl font-semibold tracking-tight">
                  {item.title}
                </span>
              </span>
              {selected && (
                <span className="fade-up mt-3 block pl-12 leading-relaxed text-cream-muted">
                  {item.body}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div
        id={id}
        className="pattern-dark relative grid min-h-[360px] place-items-center overflow-hidden rounded-[2rem] bg-canvas p-6 text-ink sm:min-h-[460px]"
        aria-live="polite"
      >
        <div key={id} aria-hidden="true" className="fade-up flex w-full justify-center sm:scale-110">
          <Preview />
        </div>
      </div>
    </div>
  );
}
