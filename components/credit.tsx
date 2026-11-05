import { CREDIT } from "@/lib/constants";
import { cn } from "@/lib/utils";

const linkClass = "text-sm text-muted transition-colors";

/** "Designed & built by" line with a profile card that opens on hover or focus. */
export function Credit() {
  return (
    <div className="group relative inline-block">
      <p>
        Designed &amp; built by{" "}
        <button
          type="button"
          aria-describedby="credit-card"
          className="text-accent underline decoration-accent/70 underline-offset-4 transition-colors hover:text-ink"
        >
          {CREDIT.name}
        </button>
      </p>

      <div
        id="credit-card"
        className={cn(
          "invisible absolute bottom-full z-50 pb-4 opacity-0 transition duration-200",
          "translate-y-1 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100",
          "group-hover:visible group-hover:translate-y-0 group-hover:opacity-100",
          "left-0 sm:right-0 sm:left-auto",
        )}
      >
        <div className="relative flex w-[19.5rem] items-center gap-4 rounded-2xl border border-line bg-surface p-5 shadow-2xl shadow-black/60">
          <span
            aria-hidden="true"
            className="grid size-16 shrink-0 place-items-center rounded-full bg-accent font-display text-2xl font-semibold text-accent-ink"
          >
            {CREDIT.initial}
          </span>
          <div>
            <p className="font-display text-xl font-semibold tracking-tight text-ink">
              {CREDIT.name}
            </p>
            <p className="text-sm text-muted">{CREDIT.role}</p>
            <ul className="mt-2.5 flex flex-wrap gap-x-3.5 gap-y-1">
              {CREDIT.links.map((link) => (
                <li key={link.label}>
                  {link.href ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(linkClass, "hover:text-accent")}
                    >
                      {link.label}
                    </a>
                  ) : (
                    <span className={linkClass}>{link.label}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <span
            aria-hidden="true"
            className="absolute -bottom-1.5 left-8 size-3 rotate-45 border-r border-b border-line bg-surface sm:right-8 sm:left-auto"
          />
        </div>
      </div>
    </div>
  );
}
