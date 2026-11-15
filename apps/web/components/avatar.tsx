import Image from "next/image";
import { cn } from "@/lib/utils";

type AvatarProps = {
  letter: string;
  color: string;
  size?: "sm" | "md" | "lg";
  square?: boolean;
  /** Hubs have no face, so they keep the coloured letter. */
  hub?: boolean;
};

const sizes = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-16 text-xl",
} as const;

const FACES: Record<string, string> = {
  M: "/photos/face-mira.webp",
  J: "/photos/face-jonah.webp",
  D: "/photos/face-dami.webp",
  T: "/photos/face-tola.webp",
  L: "/photos/face-leo.webp",
};

export function Avatar({ letter, color, size = "sm", square = false, hub = false }: AvatarProps) {
  const face = hub ? undefined : FACES[letter];
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden font-semibold text-black",
        sizes[size],
        square ? (size === "lg" ? "rounded-2xl" : "rounded-xl") : "rounded-full",
      )}
      style={{ background: color }}
    >
      {face ? <Image src={face} alt="" width={96} height={96} className="size-full object-cover" /> : letter}
    </span>
  );
}
