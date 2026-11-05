import { colors } from "@ricochet/shared";
import { Text, TextInput, View, type TextInputProps } from "react-native";

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string | null;
  hint?: string;
};

export function TextField({ label, error, hint, className, ...rest }: TextFieldProps) {
  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-muted">{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.dark.muted}
        selectionColor={colors.accent}
        className={[
          "h-14 rounded-2xl border bg-surface px-4 text-base text-ink",
          error ? "border-[#f87171]" : "border-line focus:border-muted",
          className ?? "",
        ].join(" ")}
        {...rest}
      />
      {error ? (
        <Text accessibilityRole="alert" className="text-sm text-[#f87171]">
          {error}
        </Text>
      ) : hint ? (
        <Text className="text-sm text-muted">{hint}</Text>
      ) : null}
    </View>
  );
}
