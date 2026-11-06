import { Ionicons } from "@expo/vector-icons";
import { Pressable, type PressableProps } from "react-native";
import { useTheme } from "@/theme/theme-provider";

type IconButtonProps = Omit<PressableProps, "children"> & {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  variant?: "filled" | "plain" | "accent";
  size?: number;
};

export function IconButton({ icon, label, variant = "filled", size = 44, className, ...rest }: IconButtonProps) {
  const { colors } = useTheme();
  const background = variant === "filled" ? "bg-raised" : variant === "accent" ? "bg-accent" : "";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={{ width: size, height: size }}
      className={`items-center justify-center rounded-full active:opacity-70 ${background} ${className ?? ""}`}
      {...rest}
    >
      <Ionicons name={icon} size={size * 0.5} color={variant === "accent" ? colors.accentInk : colors.ink} />
    </Pressable>
  );
}
