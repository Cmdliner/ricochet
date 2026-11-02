type ClassValue = string | false | null | undefined;

export function cn(...values: ClassValue[]) {
  return values.filter(Boolean).join(" ");
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

type ButtonOptions = {
  variant?: "primary" | "secondary";
  size?: "md" | "lg";
};

export function buttonClass({ variant = "primary", size = "md" }: ButtonOptions = {}) {
  return cn(
    "inline-flex shrink-0 items-center justify-center rounded-full font-medium transition-colors",
    size === "md" ? "h-10 px-5 text-sm" : "h-12 px-7 text-[0.95rem]",
    variant === "primary"
      ? "bg-ink text-black hover:bg-white/80"
      : "border border-line text-ink hover:bg-raised",
  );
}
