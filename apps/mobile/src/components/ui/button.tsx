import { ActivityIndicator, Pressable, Text, type PressableProps } from "react-native";

type ButtonProps = Omit<PressableProps, "children"> & {
  label: string;
  /** Primary is the coral call to action. Ghost is a quiet text button. */
  variant?: "primary" | "ghost";
  loading?: boolean;
};

export function Button({ label, variant = "primary", loading = false, disabled, className, ...rest }: ButtonProps) {
  const inactive = disabled || loading;
  const primary = variant === "primary";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      className={[
        "h-14 items-center justify-center rounded-full active:opacity-80",
        primary ? "bg-accent" : "bg-transparent",
        inactive ? "opacity-50" : "",
        className ?? "",
      ].join(" ")}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={primary ? "#1f0c05" : "#f6f1ea"} />
      ) : (
        <Text className={`text-base font-semibold ${primary ? "text-accent-ink" : "text-ink"}`}>{label}</Text>
      )}
    </Pressable>
  );
}
