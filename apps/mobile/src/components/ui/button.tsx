import { ActivityIndicator, type PressableProps } from "react-native";
import { useTheme } from "@/theme/theme-provider";
import { PressableScale } from "./pressable-scale";
import { Text } from "./text";

type ButtonProps = Omit<PressableProps, "children"> & {
  label: string;
  /** Primary is the coral call to action. Ghost is a quiet text button. */
  variant?: "primary" | "ghost";
  loading?: boolean;
  className?: string;
};

export function Button({ label, variant = "primary", loading = false, disabled, className, ...rest }: ButtonProps) {
  const { colors } = useTheme();
  const inactive = disabled || loading;
  const primary = variant === "primary";

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      scaleTo={0.97}
      className={[
        "h-14 items-center justify-center rounded-full",
        primary ? "bg-accent" : "bg-transparent",
        inactive ? "opacity-50" : "",
        className ?? "",
      ].join(" ")}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={primary ? colors.accentInk : colors.ink} />
      ) : (
        <Text className={`text-base font-sans-semibold ${primary ? "text-accent-ink" : "text-ink"}`}>{label}</Text>
      )}
    </PressableScale>
  );
}
