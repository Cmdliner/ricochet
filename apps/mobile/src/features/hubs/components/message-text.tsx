import { useMemo } from "react";
import { Text } from "@/components/ui/text";
import { useTheme } from "@/theme/theme-provider";
import { splitMentions } from "../mentions";
import { useHubsStore } from "../store";
import { ME_ID } from "../types";

/**
 * A message's text, with tags drawn so they read as tags: bold and coloured. A tag of the signed-in person also
 * gets a soft highlight, since it is the one that is for them. A word that only looks like a tag, because nobody
 * here has that handle, stays plain.
 */
export function MessageText({ text, mine, className }: { text: string; mine: boolean; className: string }) {
  const { colors } = useTheme();
  const members = useHubsStore((s) => s.members);
  const byHandle = useMemo(() => new Map(Object.values(members).map((member) => [member.handle.toLowerCase(), member.id])), [members]);
  const segments = useMemo(() => splitMentions(text), [text]);

  return (
    <Text className={className}>
      {segments.map((segment, index) => {
        const target = segment.handle ? byHandle.get(segment.handle) : undefined;
        if (!target) return segment.text;
        const forMe = target === ME_ID;
        return (
          <Text
            key={index}
            className={`font-sans-semibold ${mine ? "text-accent-ink underline" : ""}`}
            style={{
              color: mine ? undefined : colors.accentText,
              backgroundColor: forMe && !mine ? `${colors.accent}33` : undefined,
            }}
          >
            {segment.text}
          </Text>
        );
      })}
    </Text>
  );
}
