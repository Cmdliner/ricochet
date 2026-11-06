import { HUB_ICONS, type HubColor, type HubIcon } from "@ricochet/shared";
import { Pressable, View } from "react-native";
import { useTheme } from "@/theme/theme-provider";
import { HubAvatar } from "./hub-avatar";

type HubIconPickerProps = {
  value: HubIcon;
  onChange: (icon: HubIcon) => void;
  color: HubColor;
  name: string;
};

export function HubIconPicker({ value, onChange, color, name }: HubIconPickerProps) {
  const { colors } = useTheme();
  const rows = Array.from({ length: Math.ceil(HUB_ICONS.length / 4) }, (_, i) => HUB_ICONS.slice(i * 4, i * 4 + 4));
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel="Hub picture" className="gap-3">
      {rows.map((row, index) => (
        <View key={index} className="flex-row justify-between">
          {row.map((icon) => {
            const selected = icon === value;
            return (
              <Pressable
                key={icon}
                accessibilityRole="radio"
                accessibilityLabel={icon.replace("-", " ")}
                accessibilityState={{ selected }}
                onPress={() => onChange(icon)}
                style={{ borderColor: selected ? colors.ink : "transparent" }}
                className="rounded-[20px] border-[2.5px] p-0.5"
              >
                <HubAvatar name={name} color={color} icon={icon} size={58} />
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
