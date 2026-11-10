import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  body: string;
  /** `dark` sits on the dark canvas, `light` on the cream sections. */
  tone?: "dark" | "light";
  className?: string;
};

/** Left-aligned and tight on a phone. From the large breakpoint the title and the sentence sit side by side. */
export function SectionHeading({ eyebrow, title, body, tone = "dark", className }: SectionHeadingProps) {
  const light = tone === "light";
  return (
    <div className={cn("grid gap-3 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-16", className)}>
      <div>
        <p className={cn("text-sm font-semibold", light ? "text-accent-deep" : "text-accent")}>{eyebrow}</p>
        <h2 className="mt-2 font-display text-[1.85rem] leading-[1.08] font-semibold tracking-[-0.03em] text-balance sm:mt-3 sm:text-5xl">
          {title}
        </h2>
      </div>
      <p className={cn("max-w-md text-[0.95rem] leading-relaxed sm:text-lg", light ? "text-cream-muted" : "text-muted")}>
        {body}
      </p>
    </div>
  );
}
