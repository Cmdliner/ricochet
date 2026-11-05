import { TextInput, View, type TextInputProps } from "react-native";
import { useTheme } from "@/theme/theme-provider";
import { Text } from "./text";

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string | null;
  hint?: string;
  className?: string;
};

/** A filled input: a soft raised surface that gets an accent outline when you are typing in it. */
export function TextField({ label, error, hint, className, ...rest }: TextFieldProps) {
  const { colors } = useTheme();
  return (
    <View className="gap-2">
      <Text className="text-[13px] font-sans-semibold tracking-wide text-muted">{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        selectionColor={colors.accent}
        className={[
          "h-14 rounded-2xl border-[1.5px] bg-raised px-4 font-sans text-base text-ink",
          error ? "border-danger" : "border-transparent focus:border-accent",
          className ?? "",
        ].join(" ")}
        {...rest}
      />
      {error ? (
        <Text accessibilityRole="alert" className="text-sm text-danger">
          {error}
        </Text>
      ) : hint ? (
        <Text className="text-sm text-muted">{hint}</Text>
      ) : null}
    </View>
  );
}
