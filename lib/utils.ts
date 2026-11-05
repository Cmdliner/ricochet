type ClassValue = string | false | null | undefined;

export function cn(...values: ClassValue[]) {
  return values.filter(Boolean).join(" ");
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

type ButtonOptions = {
  variant?: "primary" | "secondary" | "dark";
  size?: "md" | "lg";
};

const variants = {
  primary: "bg-accent text-accent-ink hover:brightness-110",
  secondary: "border border-line text-ink hover:bg-raised",
  dark: "bg-black text-ink hover:bg-black/80",
} as const;

export function buttonClass({ variant = "primary", size = "md" }: ButtonOptions = {}) {
  return cn(
    "inline-flex shrink-0 items-center justify-center rounded-full font-semibold transition",
    size === "md" ? "h-10 px-5 text-sm" : "h-12 px-7 text-[0.95rem]",
    variants[variant],
  );
}
