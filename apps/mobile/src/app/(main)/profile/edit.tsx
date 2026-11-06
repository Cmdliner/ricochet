import { authUserSchema, displayNameSchema, handleSchema, type HubColor } from "@ricochet/shared";
import { router, useNavigation, usePreventRemove } from "expo-router";
import { useRef, useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/ui/color-picker";
import { PressableScale } from "@/components/ui/pressable-scale";
import { ScreenHeader } from "@/components/ui/screen-header";
import { SectionLabel } from "@/components/ui/section-label";
import { Text } from "@/components/ui/text";
import { TextField } from "@/components/ui/text-field";
import { BIO_MAX, STATUS_MAX, useProfileStore } from "@/features/profile/store";
import { api, ApiError, errorMessage } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

const EMOJIS = ["🎧", "💻", "🌙", "☕", "🚀", "🎯", "🎮", "📚", "🏃", "🌴", "🎨", "🙂"];

const SUGGESTIONS = [
  { emoji: "🎧", text: "Heads down, back soon" },
  { emoji: "📅", text: "In a meeting" },
  { emoji: "🍜", text: "Out for lunch" },
  { emoji: "🌴", text: "On holiday" },
];

type Errors = { name?: string; handle?: string; general?: string };

export default function EditProfile() {
  const user = useAuthStore((s) => s.user);
  const saved = useProfileStore();
  const navigation = useNavigation();

  const [name, setName] = useState(user?.displayName ?? "");
  const [handle, setHandle] = useState(user?.handle ?? "");
  const [bio, setBio] = useState(saved.bio);
  const [emoji, setEmoji] = useState<string | null>(saved.status?.emoji ?? null);
  const [statusText, setStatusText] = useState(saved.status?.text ?? "");
  const [color, setColor] = useState<HubColor>(saved.avatarColor);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const allowLeave = useRef(false);

  const dirty =
    name.trim() !== (user?.displayName ?? "") ||
    handle !== (user?.handle ?? "") ||
    bio.trim() !== saved.bio ||
    statusText.trim() !== (saved.status?.text ?? "") ||
    (statusText.trim() ? (emoji ?? "💬") : null) !== (saved.status?.emoji ?? null) ||
    color !== saved.avatarColor;

  usePreventRemove(dirty, ({ data }) => {
    // A finished save leaves straight away: the hook only learns the form is clean on the next render.
    if (allowLeave.current) {
      navigation.dispatch(data.action);
      return;
    }
    Alert.alert("Discard changes?", "You have edits that have not been saved.", [
      { text: "Keep editing", style: "cancel" },
      { text: "Discard", style: "destructive", onPress: () => navigation.dispatch(data.action) },
    ]);
  });

  async function save() {
    if (!user) return;
    const nameResult = displayNameSchema.safeParse(name);
    const handleResult = handleSchema.safeParse(handle);
    if (!nameResult.success || !handleResult.success) {
      setErrors({
        name: nameResult.success ? undefined : nameResult.error.issues[0]?.message,
        handle: handleResult.success ? undefined : handleResult.error.issues[0]?.message,
      });
      return;
    }

    setBusy(true);
    setErrors({});
    try {
      // Only what changed goes to the server. Bio, status and colour stay on this device for now.
      const patch: { displayName?: string; handle?: string } = {};
      if (nameResult.data !== user.displayName) patch.displayName = nameResult.data;
      if (handleResult.data !== user.handle) patch.handle = handleResult.data;
      if (Object.keys(patch).length > 0) {
        const updated = await api("/me", { method: "PATCH", auth: true, body: patch, schema: authUserSchema });
        useAuthStore.getState().setUser(updated);
      }

      const text = statusText.trim();
      useProfileStore.getState().update({
        bio: bio.trim(),
        status: text ? { emoji: emoji ?? "💬", text } : null,
        avatarColor: color,
      });
      allowLeave.current = true;
      router.back();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) setErrors({ handle: e.message });
      else setErrors({ general: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  }

  const previewName = name.trim() || "Your name";
  const previewStatus = statusText.trim() ? { emoji: emoji ?? "💬", text: statusText.trim() } : null;

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      <ScreenHeader
        title="Edit profile"
        subtitle="How people see you"
        closeStyle
        actions={
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Save"
            accessibilityState={{ disabled: !dirty || busy }}
            disabled={!dirty || busy}
            onPress={save}
            className={`h-10 items-center justify-center rounded-full px-5 ${dirty ? "bg-accent" : "bg-raised"}`}
          >
            <Text className={`text-sm font-sans-semibold ${dirty ? "text-accent-ink" : "text-muted"}`}>Save</Text>
          </PressableScale>
        }
      />

      <KeyboardAwareScrollView bottomOffset={64} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
        <View className="px-4">
          <View className="mt-5 items-center rounded-3xl border border-line bg-surface px-5 pt-6 pb-5">
            <Avatar name={previewName} color={color} size={84} />
            <Text className="mt-3 font-display text-[24px] tracking-tight text-ink" numberOfLines={1}>
              {previewName}
            </Text>
            <Text className="text-base text-muted">@{handle || "handle"}</Text>
            {bio.trim() ? <Text className="mt-3 text-center text-[15px] leading-[22px] text-ink">{bio.trim()}</Text> : null}
            {previewStatus ? (
              <View className="mt-3 flex-row items-center gap-2 rounded-full bg-raised py-1.5 pr-3.5 pl-3">
                <Text className="text-sm">{previewStatus.emoji}</Text>
                <Text className="text-sm font-sans-medium text-ink" numberOfLines={1}>
                  {previewStatus.text}
                </Text>
              </View>
            ) : null}
          </View>

          {errors.general ? (
            <Text accessibilityRole="alert" className="mt-4 rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">
              {errors.general}
            </Text>
          ) : null}

          <SectionLabel>Avatar colour</SectionLabel>
          <ColorPicker value={color} onChange={setColor} />

          <SectionLabel>About you</SectionLabel>
          <View className="gap-5 rounded-3xl border border-line bg-surface p-4">
            <TextField
              label="Name"
              value={name}
              onChangeText={(value) => {
                setName(value);
                if (errors.name) setErrors((e) => ({ ...e, name: undefined }));
              }}
              error={errors.name}
              autoComplete="name"
              textContentType="name"
              maxLength={50}
            />
            <TextField
              label="Handle"
              value={handle}
              onChangeText={(value) => {
                setHandle(value.toLowerCase());
                if (errors.handle) setErrors((e) => ({ ...e, handle: undefined }));
              }}
              error={errors.handle}
              hint="Letters, numbers and underscores. People find you with it."
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={30}
            />
            <View>
              <TextField
                label="Bio"
                value={bio}
                onChangeText={setBio}
                multiline
                maxLength={BIO_MAX}
                placeholder="A line or two about you"
                className="h-24 pt-3.5"
                textAlignVertical="top"
              />
              <Text className="mt-1.5 text-right text-xs text-muted">
                {bio.length}/{BIO_MAX}
              </Text>
            </View>
          </View>

          <SectionLabel>Status</SectionLabel>
          <View className="gap-4 rounded-3xl border border-line bg-surface p-4">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {EMOJIS.map((option) => {
                const selected = option === emoji;
                return (
                  <Pressable
                    key={option}
                    accessibilityRole="radio"
                    accessibilityLabel={`Status emoji ${option}`}
                    accessibilityState={{ selected }}
                    onPress={() => setEmoji(selected ? null : option)}
                    className={`size-12 items-center justify-center rounded-2xl border-2 ${selected ? "border-accent bg-raised" : "border-transparent bg-raised"}`}
                  >
                    <Text className="text-[22px]">{option}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <TextField label="What are you up to?" value={statusText} onChangeText={setStatusText} maxLength={STATUS_MAX} placeholder="Heads down, back soon" />
            <View className="flex-row flex-wrap gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <Pressable
                  key={suggestion.text}
                  accessibilityRole="button"
                  onPress={() => {
                    setEmoji(suggestion.emoji);
                    setStatusText(suggestion.text);
                  }}
                  className="flex-row items-center gap-1.5 rounded-full border border-line px-3 py-2 active:opacity-70"
                >
                  <Text className="text-sm">{suggestion.emoji}</Text>
                  <Text className="text-[13px] font-sans-medium text-muted">{suggestion.text}</Text>
                </Pressable>
              ))}
            </View>
            {statusText || emoji ? (
              <Button
                label="Clear status"
                variant="ghost"
                className="h-11 border border-line"
                onPress={() => {
                  setEmoji(null);
                  setStatusText("");
                }}
              />
            ) : null}
          </View>

          <View className="mt-8">
            <Button label="Save changes" onPress={save} loading={busy} disabled={!dirty} />
          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
