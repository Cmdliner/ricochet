import { Ionicons } from "@expo/vector-icons";
import { colors as tokens, createHubSchema, defaultHubIcon, STARTER_PODS, type HubColor, type HubIcon, type StarterPod } from "@ricochet/shared";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { HubAvatar } from "@/components/ui/hub-avatar";
import { HubIconPicker } from "@/components/ui/hub-icon-picker";
import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/ui/color-picker";
import { Sheet } from "@/components/ui/sheet";
import { Text } from "@/components/ui/text";
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
  // Until you pick one, the hub gets a picture chosen from its name, and the preview shows it.
  const [pickedIcon, setPickedIcon] = useState<HubIcon | null>(null);
  const icon = pickedIcon ?? defaultHubIcon(name || "?");
  const [pods, setPods] = useState<StarterPod[]>(["general", "announcements"]);
  const [errors, setErrors] = useState<{ name?: string; pods?: string }>({});

  const togglePod = (pod: StarterPod) =>
    setPods((current) => (current.includes(pod) ? current.filter((p) => p !== pod) : [...current, pod]));

  function submit() {
    const parsed = createHubSchema.safeParse({ name, color, icon, starterPods: pods });
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
    <Sheet title="Create a hub">
      <View className="gap-6 pt-2">
        <View className="flex-row items-center gap-4">
          <HubAvatar name={name || "?"} color={color} icon={icon} size={64} />
          <View className="flex-1">
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
          </View>
        </View>

        <View className="gap-3">
          <Text className="text-sm font-sans-medium text-muted">Colour</Text>
          <ColorPicker value={color} onChange={setColor} />
        </View>

        <View className="gap-3">
          <Text className="text-sm font-sans-medium text-muted">Picture</Text>
          <HubIconPicker value={icon} onChange={setPickedIcon} color={color} name={name || "?"} />
        </View>

        <View className="gap-3">
          <Text className="text-sm font-sans-medium text-muted">Starter pods</Text>
          <View className="overflow-hidden rounded-3xl bg-raised">
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
                  className={`flex-row items-center gap-3 px-4 py-3.5 active:opacity-70 ${index > 0 ? "border-t border-line" : ""}`}
                >
                  <View className={`size-6 items-center justify-center rounded-lg border-2 ${selected ? "border-accent bg-accent" : "border-line"}`}>
                    {selected ? <Ionicons name="checkmark" size={16} color={tokens.accentInk} /> : null}
                  </View>
                  <View className="flex-1">
                    <Text className="text-[16px] font-sans-semibold text-ink"># {pod}</Text>
                    <Text className="text-sm text-muted">{POD_DESCRIPTIONS[pod]}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
          {errors.pods ? <Text className="text-sm text-danger">{errors.pods}</Text> : null}
        </View>

        <Button label="Create hub" onPress={submit} />
      </View>
    </Sheet>
  );
}
