import { Ionicons } from "@expo/vector-icons";
import { colors as tokens, createHubSchema, HUB_COLORS, STARTER_PODS, type HubColor, type StarterPod } from "@ricochet/shared";
import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScreenHeader } from "@/components/ui/screen-header";
import { SectionLabel } from "@/components/ui/section-label";
import { TextField } from "@/components/ui/text-field";
import { useHubsStore } from "@/features/hubs/store";
import { useTheme } from "@/theme/theme-provider";

const POD_DESCRIPTIONS: Record<StarterPod, string> = {
  general: "Everything else",
  announcements: "News from you and your team",
  "off-topic": "Memes, music and the weather",
};

export default function CreateHub() {
  const { colors } = useTheme();
  const createHub = useHubsStore((s) => s.createHub);

  const [name, setName] = useState("");
  const [color, setColor] = useState<HubColor>("coral");
  const [pods, setPods] = useState<StarterPod[]>(["general", "announcements"]);
  const [errors, setErrors] = useState<{ name?: string; pods?: string }>({});

  const togglePod = (pod: StarterPod) =>
    setPods((current) => (current.includes(pod) ? current.filter((p) => p !== pod) : [...current, pod]));

  function submit() {
    const parsed = createHubSchema.safeParse({ name, color, starterPods: pods });
    if (!parsed.success) {
      const next: { name?: string; pods?: string } = {};
      for (const issue of parsed.error.issues) {
        if (issue.path[0] === "name") next.name ??= issue.message;
        if (issue.path[0] === "starterPods") next.pods ??= issue.message;
      }
      setErrors(next);
      return;
    }
    const hubId = createHub(parsed.data);
    router.replace(`/hub/${hubId}`);
  }

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      <ScreenHeader title="Create a hub" closeStyle />
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerClassName="px-5 pb-10" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View className="items-center gap-3 py-8">
            <Avatar name={name || "?"} color={color} size={96} square />
            <Text className="text-xl font-bold text-ink" numberOfLines={1}>
              {name.trim() || "Your hub"}
            </Text>
          </View>

          <TextField
            label="Hub name"
            placeholder="Ship It"
            value={name}
            onChangeText={(value) => {
              setName(value);
              if (errors.name) setErrors((e) => ({ ...e, name: undefined }));
            }}
            error={errors.name}
            maxLength={40}
            autoFocus
            returnKeyType="done"
          />

          <SectionLabel>Colour</SectionLabel>
          <View className="flex-row gap-4">
            {HUB_COLORS.map((option) => {
              const selected = option === color;
              return (
                <Pressable
                  key={option}
                  accessibilityRole="radio"
                  accessibilityLabel={option}
                  accessibilityState={{ selected }}
                  onPress={() => setColor(option)}
                  style={{ backgroundColor: tokens.avatar[option], borderColor: selected ? colors.ink : "transparent" }}
                  className="size-14 items-center justify-center rounded-full border-[3px]"
                >
                  {selected ? <Ionicons name="checkmark" size={24} color={tokens.accentInk} /> : null}
                </Pressable>
              );
            })}
          </View>

          <SectionLabel>Starter pods</SectionLabel>
          <View className="overflow-hidden rounded-3xl border border-line bg-surface">
            {STARTER_PODS.map((pod, index) => {
              const selected = pods.includes(pod);
              return (
                <Pressable
                  key={pod}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  onPress={() => {
                    togglePod(pod);
                    if (errors.pods) setErrors((e) => ({ ...e, pods: undefined }));
                  }}
                  className={`flex-row items-center gap-3 px-4 py-4 active:bg-raised ${index > 0 ? "border-t border-line" : ""}`}
                >
                  <View className={`size-6 items-center justify-center rounded-lg border-2 ${selected ? "border-accent bg-accent" : "border-line"}`}>
                    {selected ? <Ionicons name="checkmark" size={16} color={tokens.accentInk} /> : null}
                  </View>
                  <View className="flex-1">
                    <Text className="text-[16px] font-semibold text-ink"># {pod}</Text>
                    <Text className="text-sm text-muted">{POD_DESCRIPTIONS[pod]}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
          {errors.pods ? <Text className="mt-2 text-sm text-danger">{errors.pods}</Text> : null}

          <Button label="Create hub" className="mt-8" onPress={submit} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
