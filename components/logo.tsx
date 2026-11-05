import { cn } from "@/lib/utils";

export function LogoMark({ className, inverse = false }: { className?: string; inverse?: boolean }) {
  const mark = inverse ? "#ccff44" : "#0a0f00";
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="9" fill={inverse ? "#0a0f00" : "#ccff44"} />
      <path
        d="M7.5 9 14 23 22 12"
        fill="none"
        stroke={mark}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="25" cy="8.5" r="2.4" fill={mark} />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className="size-8" />
      <span className="font-display text-[1.4rem] leading-none font-semibold tracking-tight">
        ricochet
      </span>
    </span>
  );
}
