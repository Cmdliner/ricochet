import { Text, TextInput, View, type TextInputProps } from "react-native";
import { useTheme } from "@/theme/theme-provider";

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string | null;
  hint?: string;
};

export function TextField({ label, error, hint, className, ...rest }: TextFieldProps) {
  const { colors } = useTheme();
  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-muted">{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        selectionColor={colors.accent}
        className={[
          "h-14 rounded-2xl border bg-surface px-4 text-base text-ink",
          error ? "border-danger" : "border-line focus:border-muted",
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
