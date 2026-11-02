import { cn } from "@/lib/utils";

type StoreCardProps = {
  platform: string;
  store: string;
  description: string;
};

export function StoreCard({ platform, store, description }: StoreCardProps) {
  return (
    <article className="flex flex-col rounded-3xl border border-line bg-surface p-8">
      <div className="flex items-start justify-between">
        <span
          aria-hidden="true"
          className="grid size-12 place-items-center rounded-2xl border border-line bg-raised"
        >
          <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
            <path d="M11 18.5h2" />
          </svg>
        </span>
        <span className="rounded-full border border-line px-3 py-1 text-xs text-muted">
          Coming soon
        </span>
      </div>

      <h2 className="mt-8 font-display text-2xl font-semibold tracking-tight">{platform}</h2>
      <p className="mt-2 leading-relaxed text-muted">{description}</p>

      <button
        type="button"
        disabled
        aria-label={`${store} download, coming soon`}
        className={cn(
          "mt-8 flex h-12 w-full cursor-not-allowed items-center justify-center rounded-full",
          "border border-line text-[0.95rem] font-medium text-muted",
        )}
      >
        {store} · Coming soon
      </button>
    </article>
  );
}
