import {
  authUserSchema,
  avatarUploadSchema,
  BIO_MAX,
  displayNameSchema,
  handleSchema,
  STATUS_TEXT_MAX,
  type HubColor,
  type UpdateProfileInput,
} from "@ricochet/shared";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { router, useNavigation, usePreventRemove } from "expo-router";
import { useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
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
import { useHubsStore } from "@/features/hubs/store";
import { api, ApiError, errorMessage } from "@/lib/api";
import { localFileSize, mediaUrl, uploadLocalFile } from "@/lib/media";
import { showError } from "@/lib/notify";
import { useAuthStore } from "@/stores/auth-store";
import { showDialog } from "@/lib/dialog";

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
  const savedBio = user?.bio ?? "";
  const savedStatus = user?.status ?? null;
  const savedColor = user?.avatarColor ?? "coral";
  const navigation = useNavigation();

  const [name, setName] = useState(user?.displayName ?? "");
  const [handle, setHandle] = useState(user?.handle ?? "");
  const [bio, setBio] = useState(savedBio);
  const [emoji, setEmoji] = useState<string | null>(savedStatus?.emoji ?? null);
  const [statusText, setStatusText] = useState(savedStatus?.text ?? "");
  const [color, setColor] = useState<HubColor>(savedColor);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const allowLeave = useRef(false);

  const dirty =
    name.trim() !== (user?.displayName ?? "") ||
    handle !== (user?.handle ?? "") ||
    bio.trim() !== savedBio ||
    statusText.trim() !== (savedStatus?.text ?? "") ||
    (statusText.trim() ? (emoji ?? "💬") : null) !== (savedStatus?.emoji ?? null) ||
    color !== savedColor;

  usePreventRemove(dirty, ({ data }) => {
    // A finished save leaves straight away: the hook only learns the form is clean on the next render.
    if (allowLeave.current) {
      navigation.dispatch(data.action);
      return;
    }
    showDialog("Discard changes?", "You have edits that have not been saved.", [
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
      // Only what changed goes to the server.
      const text = statusText.trim();
      const nextStatus = text ? { emoji: emoji ?? "💬", text } : null;
      const patch: UpdateProfileInput = {};
      if (nameResult.data !== user.displayName) patch.displayName = nameResult.data;
      if (handleResult.data !== user.handle) patch.handle = handleResult.data;
      if (bio.trim() !== savedBio) patch.bio = bio.trim();
      if (color !== savedColor) patch.avatarColor = color;
      if (nextStatus?.text !== savedStatus?.text || nextStatus?.emoji !== savedStatus?.emoji) patch.status = nextStatus;

      if (Object.keys(patch).length > 0) {
        const updated = await api("/me", { method: "PATCH", auth: true, body: patch, schema: authUserSchema });
        useAuthStore.getState().setUser(updated);
        useHubsStore.getState().refreshSelf();
      }
      allowLeave.current = true;
      router.back();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) setErrors({ handle: e.message });
      else setErrors({ general: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  }

  async function pickPhoto() {
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 1 });
    const asset = picked.assets?.[0];
    if (picked.canceled || !asset) return;

    setPhotoBusy(true);
    try {
      // Resized here so the server never has to handle a 12 megapixel photo for a 84 pixel circle.
      const resized = await ImageManipulator.manipulateAsync(asset.uri, [{ resize: { width: 512 } }], {
        compress: 0.8,
        format: ImageManipulator.SaveFormat.JPEG,
      });
      const { key, upload } = await api("/me/avatar/upload", {
        method: "POST",
        auth: true,
        body: { contentType: "image/jpeg", size: await localFileSize(resized.uri) },
        schema: avatarUploadSchema,
      });
      await uploadLocalFile(upload, resized.uri);
      const updated = await api("/me/avatar", { method: "POST", auth: true, body: { key }, schema: authUserSchema });
      useAuthStore.getState().setUser(updated);
      useHubsStore.getState().refreshSelf();
    } catch (caught) {
      showError(caught, "Could not update your photo");
    } finally {
      setPhotoBusy(false);
    }
  }

  async function removePhoto() {
    setPhotoBusy(true);
    try {
      const updated = await api("/me/avatar", { method: "DELETE", auth: true, schema: authUserSchema });
      useAuthStore.getState().setUser(updated);
      useHubsStore.getState().refreshSelf();
    } catch (caught) {
      showError(caught, "Could not remove your photo");
    } finally {
      setPhotoBusy(false);
    }
  }

  function photoMenu() {
    showDialog("Profile photo", undefined, [
      { text: "Choose a photo", onPress: () => void pickPhoto() },
      ...(user?.avatarUrl ? [{ text: "Remove photo", style: "destructive" as const, onPress: () => void removePhoto() }] : []),
      { text: "Cancel", style: "cancel" as const },
    ]);
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
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Change profile photo"
              disabled={photoBusy}
              onPress={photoMenu}
              className="active:opacity-80"
            >
              <Avatar name={previewName} color={color} uri={mediaUrl(user?.avatarUrl)} size={84} />
              <View className="absolute -right-1 -bottom-1 size-8 items-center justify-center rounded-full border-2 border-surface bg-accent">
                {photoBusy ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="camera" size={15} color="#fff" />}
              </View>
            </Pressable>
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
            <TextField label="What are you up to?" value={statusText} onChangeText={setStatusText} maxLength={STATUS_TEXT_MAX} placeholder="Heads down, back soon" />
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
