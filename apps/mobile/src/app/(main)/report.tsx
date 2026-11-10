import { Ionicons } from "@expo/vector-icons";
import { REPORT_DETAILS_MAX, REPORT_REASONS, type ReportReason } from "@ricochet/shared";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, Switch, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Text } from "@/components/ui/text";
import { TextField } from "@/components/ui/text-field";
import { useHubsStore } from "@/features/hubs/store";
import { useSafetyStore } from "@/features/safety/store";
import { showDialog } from "@/lib/dialog";
import { showError } from "@/lib/notify";
import { useTheme } from "@/theme/theme-provider";

const LABELS: Record<ReportReason, string> = {
  spam: "Spam or scams",
  harassment: "Harassment or bullying",
  inappropriate: "Inappropriate content",
  impersonation: "Pretending to be someone else",
  other: "Something else",
};

export default function ReportSheet() {
  const { userId, name, messageId } = useLocalSearchParams<{ userId: string; name: string; messageId?: string }>();
  const { colors } = useTheme();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [alsoBlock, setAlsoBlock] = useState(false);
  const [sending, setSending] = useState(false);
  const member = useHubsStore((s) => (userId ? s.members[userId] : undefined));

  async function send() {
    if (!reason || !userId) return;
    setSending(true);
    try {
      const store = useSafetyStore.getState();
      await store.report({ ...(messageId ? { messageId } : { userId }), reason, details: details.trim() || undefined });
      if (alsoBlock && member) await store.block(member);
      router.back();
      showDialog("Report sent", "Thank you. We will take a look. They are not told that it was you.");
    } catch (error) {
      showError(error, "Could not send the report");
    } finally {
      setSending(false);
    }
  }

  return (
    <Sheet title={messageId ? "Report message" : `Report ${name ?? "this person"}`}>
      <View className="gap-1 pb-2">
        <Text className="pb-2 text-sm text-muted">
          {messageId ? `This message from ${name ?? "them"} goes to the people who review reports.` : "This goes to the people who review reports."} They are not told that it was you.
        </Text>

        {REPORT_REASONS.map((option) => {
          const selected = reason === option;
          return (
            <Pressable
              key={option}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => setReason(option)}
              className="flex-row items-center gap-3 rounded-2xl px-1 py-3 active:bg-raised"
            >
              <Ionicons name={selected ? "radio-button-on" : "radio-button-off"} size={22} color={selected ? colors.accent : colors.muted} />
              <Text className="flex-1 text-base text-ink">{LABELS[option]}</Text>
            </Pressable>
          );
        })}

        <View className="pt-3">
          <TextField
            label="Anything we should know? (optional)"
            value={details}
            onChangeText={setDetails}
            maxLength={REPORT_DETAILS_MAX}
            multiline
            className="h-24 py-3"
            textAlignVertical="top"
          />
        </View>

        {member ? (
          <View className="flex-row items-center gap-3 py-3">
            <Text className="flex-1 text-base text-ink">Also block {name}</Text>
            <Switch
              accessibilityLabel={`Also block ${name}`}
              value={alsoBlock}
              onValueChange={setAlsoBlock}
              trackColor={{ false: colors.line, true: colors.accent }}
              thumbColor="#ffffff"
              ios_backgroundColor={colors.line}
            />
          </View>
        ) : null}

        <Button label="Send report" loading={sending} disabled={!reason} onPress={() => void send()} className="mt-2" />
      </View>
    </Sheet>
  );
}
