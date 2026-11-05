import { AppleIcon, GooglePlayIcon } from "@/components/store-icons";
import { cn } from "@/lib/utils";

type StoreBadgeProps = {
  store: "ios" | "android";
  /** "md" for menus and footers, "lg" for the download page. */
  size?: "md" | "lg";
  className?: string;
};

const stores = {
  ios: { eyebrow: "Coming soon on the", name: "App Store", Icon: AppleIcon },
  android: { eyebrow: "Coming soon on", name: "Google Play", Icon: GooglePlayIcon },
} as const;

/** Store button look-alike. Not a link yet: the apps are not published. */
export function StoreBadge({ store, size = "md", className }: StoreBadgeProps) {
  const { eyebrow, name, Icon } = stores[store];
  return (
    <div
      role="img"
      aria-label={`${name}, coming soon`}
      className={cn(
        "inline-flex items-center rounded-xl border border-white/20 bg-black text-white transition duration-200 hover:-translate-y-0.5 hover:border-white/40",
        size === "lg" ? "h-16 gap-3.5 px-6" : "h-12 gap-2.5 px-4",
        className,
      )}
    >
      <Icon className={size === "lg" ? "size-8" : "size-6"} />
      <span className="flex flex-col text-left leading-none">
        <span className={cn("text-white/70", size === "lg" ? "text-xs" : "text-[0.65rem]")}>
          {eyebrow}
        </span>
        <span
          className={cn(
            "mt-1 font-display font-semibold tracking-tight",
            size === "lg" ? "text-2xl" : "text-base",
          )}
        >
          {name}
        </span>
      </span>
    </div>
  );
}
