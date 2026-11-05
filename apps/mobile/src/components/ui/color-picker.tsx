import { Ionicons } from "@expo/vector-icons";
import { colors as tokens, HUB_COLORS, type HubColor } from "@ricochet/shared";
import { Pressable, View } from "react-native";
import { useTheme } from "@/theme/theme-provider";

/** A row of colour swatches where exactly one is selected, used to pick a hub's colour. */
export function ColorPicker({ value, onChange }: { value: HubColor; onChange: (color: HubColor) => void }) {
  const { colors } = useTheme();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel="Colour" className="flex-row gap-3">
      {HUB_COLORS.map((option) => {
        const selected = option === value;
        return (
          <Pressable
            key={option}
            accessibilityRole="radio"
            accessibilityLabel={option}
            accessibilityState={{ selected }}
            onPress={() => onChange(option)}
            style={{ backgroundColor: tokens.avatar[option], borderColor: selected ? colors.ink : "transparent" }}
            className="size-12 items-center justify-center rounded-full border-[3px]"
          >
            {selected ? <Ionicons name="checkmark" size={22} color={tokens.accentInk} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}
