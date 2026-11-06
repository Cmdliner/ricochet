import Image from "next/image";
import { LinkedInIcon, WhatsAppIcon, XIcon } from "@/components/social-icons";
import { CREDIT } from "@/lib/constants";

const icons = {
  linkedin: LinkedInIcon,
  x: XIcon,
  whatsapp: WhatsAppIcon,
} as const;

export function Credit() {
  return (
    <div className="group relative inline-block">
      <p>
        Designed &amp; built by{" "}
        <button
          type="button"
          aria-describedby="credit-card"
          className="text-accent underline decoration-accent/60 underline-offset-4 transition-colors hover:text-ink"
        >
          {CREDIT.name}
        </button>
      </p>

      <div
        id="credit-card"
        className="invisible absolute bottom-full left-1/2 z-50 -translate-x-1/2 translate-y-2 scale-95 pb-4 opacity-0 transition duration-200 ease-out group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:scale-100 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100"
      >
        <div className="relative w-[min(17rem,calc(100vw-2.5rem))] rounded-2xl border border-line bg-surface p-4 text-left shadow-xl shadow-black/60">
          <div className="flex items-center gap-3.5">
            <Image
              src={CREDIT.photo}
              alt={`Portrait of ${CREDIT.name}`}
              width={56}
              height={56}
              className="size-14 shrink-0 rounded-full object-cover object-top ring-2 ring-accent ring-offset-2 ring-offset-surface"
            />
            <div>
              <p className="font-display text-lg leading-tight font-semibold tracking-tight text-ink">
                {CREDIT.name}
              </p>
              <p className="text-[0.8rem] text-muted">{CREDIT.role}</p>
            </div>
          </div>

          <ul className="mt-4 grid grid-cols-3 gap-2">
            {CREDIT.links.map((link) => {
              const Icon = icons[link.id];
              return (
                <li key={link.id}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-12 flex-col items-center justify-center gap-1 rounded-xl border border-line bg-raised text-[0.7rem] text-muted transition hover:-translate-y-0.5 hover:border-accent/60 hover:text-ink"
                  >
                    <Icon className="size-4" />
                    {link.label}
                  </a>
                </li>
              );
            })}
          </ul>

          <span
            aria-hidden="true"
            className="absolute -bottom-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 border-r border-b border-line bg-surface"
          />
        </div>
      </div>
    </div>
  );
}
