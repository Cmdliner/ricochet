import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";

type Option<T extends string> = { value: T; label: string };

type SegmentedProps<T extends string> = {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function Segmented<T extends string>({ label, options, value, onChange }: SegmentedProps<T>) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} className="flex-row rounded-full bg-raised p-1">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            className={`h-11 flex-1 items-center justify-center rounded-full ${selected ? "bg-accent" : ""}`}
          >
            <Text className={`text-sm font-sans-semibold ${selected ? "text-accent-ink" : "text-muted"}`}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
