import { cn } from "@/lib/utils";

type AvatarProps = {
  letter: string;
  color: string;
  size?: "sm" | "md" | "lg";
  square?: boolean;
};

const sizes = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-16 text-xl",
} as const;

export function Avatar({ letter, color, size = "sm", square = false }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center font-semibold text-black",
        sizes[size],
        square ? (size === "lg" ? "rounded-2xl" : "rounded-xl") : "rounded-full",
      )}
      style={{ background: color }}
    >
      {letter}
    </span>
  );
}
