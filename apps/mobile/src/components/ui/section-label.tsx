import { Text } from "react-native";

/** A small uppercase heading that introduces a group of rows. */
export function SectionLabel({ children }: { children: string }) {
  return (
    <Text accessibilityRole="header" className="px-1 pt-6 pb-2 text-xs font-semibold tracking-widest text-muted uppercase">
      {children}
    </Text>
  );
}
