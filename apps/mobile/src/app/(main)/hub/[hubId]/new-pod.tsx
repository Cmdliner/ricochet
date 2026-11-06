import { createPodSchema, toPodName } from "@ricochet/shared";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, Switch, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Text } from "@/components/ui/text";
import { TextField } from "@/components/ui/text-field";
import { useHubPods } from "@/features/hubs/hooks";
import { useHub, useHubsStore } from "@/features/hubs/store";
import { errorMessage } from "@/lib/api";
import { useTheme } from "@/theme/theme-provider";

const NEW_CATEGORY = "__new__";

export default function NewPod() {
  const { colors } = useTheme();
  const { hubId } = useLocalSearchParams<{ hubId: string }>();
  const hub = useHub(hubId);
  const pods = useHubPods(hubId);
  const createPod = useHubsStore((s) => s.createPod);

  const categories = useMemo(() => [...new Set(pods.map((pod) => pod.category))], [pods]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>(categories[0] ?? NEW_CATEGORY);
  const [newCategory, setNewCategory] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; category?: string; description?: string }>({});
  const [busy, setBusy] = useState(false);

  const podName = toPodName(name);
  const choosingNew = category === NEW_CATEGORY || categories.length === 0;

  async function submit() {
    if (!hub) return;
    const parsed = createPodSchema.safeParse({
      name: podName,
      category: choosingNew ? newCategory : category,
      description,
      isPrivate,
    });
    const next: typeof errors = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === "name" || key === "category" || key === "description") next[key] ??= issue.message;
      }
    } else if (pods.some((pod) => pod.name === parsed.data.name)) {
      next.name = `${hub.name} already has a pod called #${parsed.data.name}.`;
    }
    if (Object.keys(next).length > 0 || !parsed.success) {
      setErrors(next);
      return;
    }
    setBusy(true);
    try {
      router.replace(`/pod/${await createPod(hub.id, parsed.data)}`);
    } catch (caught) {
      setErrors({ name: errorMessage(caught) });
      setBusy(false);
    }
  }

  return (
    <Sheet title="New pod">
      <View className="gap-5 pt-1">
        <TextField
          label="Name"
          placeholder="design-crits"
          value={name}
          onChangeText={(value) => {
            setName(value);
            if (errors.name) setErrors((e) => ({ ...e, name: undefined }));
          }}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={40}
          autoFocus
          error={errors.name}
          hint={podName ? `Will be created as #${podName}` : "Lowercase words joined by hyphens."}
        />

        <View className="gap-2.5">
          <Text className="text-[13px] font-sans-semibold tracking-wide text-muted">Category</Text>
          <View className="flex-row flex-wrap gap-2">
            {categories.map((option) => {
              const selected = !choosingNew && option === category;
              return (
                <Pressable
                  key={option}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => setCategory(option)}
                  className={`rounded-full px-4 py-2.5 ${selected ? "bg-accent" : "bg-raised"}`}
                >
                  <Text className={`text-sm font-sans-semibold ${selected ? "text-accent-ink" : "text-ink"}`}>{option}</Text>
                </Pressable>
              );
            })}
            {categories.length > 0 ? (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ selected: choosingNew }}
                onPress={() => setCategory(NEW_CATEGORY)}
                className={`rounded-full border border-dashed px-4 py-2.5 ${choosingNew ? "border-accent bg-accent" : "border-line"}`}
              >
                <Text className={`text-sm font-sans-semibold ${choosingNew ? "text-accent-ink" : "text-muted"}`}>+ New category</Text>
              </Pressable>
            ) : null}
          </View>
          {choosingNew ? (
            <TextField
              label="Category name"
              placeholder="Projects"
              value={newCategory}
              onChangeText={(value) => {
                setNewCategory(value);
                if (errors.category) setErrors((e) => ({ ...e, category: undefined }));
              }}
              maxLength={24}
              error={errors.category}
            />
          ) : null}
        </View>

        <TextField
          label="Description (optional)"
          placeholder="What is this pod for?"
          value={description}
          onChangeText={setDescription}
          maxLength={120}
          error={errors.description}
        />

        <View className="flex-row items-center gap-4 rounded-3xl bg-raised px-4 py-3.5">
          <View className="flex-1">
            <Text className="text-base font-sans-semibold text-ink">Private pod</Text>
            <Text className="text-[13px] text-muted">Only people you add can see it.</Text>
          </View>
          <Switch
            accessibilityLabel="Private pod"
            value={isPrivate}
            onValueChange={setIsPrivate}
            trackColor={{ false: colors.line, true: colors.accent }}
            thumbColor="#ffffff"
          />
        </View>

        <Button label="Create pod" onPress={submit} loading={busy} />
      </View>
    </Sheet>
  );
}
