import { Ionicons } from "@expo/vector-icons";
import { toPodName } from "@ricochet/shared";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { NotFound } from "@/components/ui/not-found";
import { PressableScale } from "@/components/ui/pressable-scale";
import { ScreenHeader } from "@/components/ui/screen-header";
import { SectionLabel } from "@/components/ui/section-label";
import { SettingGroup, SettingRow } from "@/components/ui/setting-row";
import { Text } from "@/components/ui/text";
import { TextField } from "@/components/ui/text-field";
import { pluralize } from "@/features/hubs/format";
import { useMyRole, usePodStats } from "@/features/hubs/hooks";
import { useHub, useHubsStore, usePod } from "@/features/hubs/store";
import { useTheme } from "@/theme/theme-provider";

function Stat({ icon, value, label }: { icon: keyof typeof Ionicons.glyphMap; value: number; label: string }) {
  const { colors } = useTheme();
  return (
    <View className="flex-1 items-center gap-1 py-4">
      <Ionicons name={icon} size={18} color={colors.accent} />
      <Text className="font-display text-[20px] tracking-tight text-ink">{value}</Text>
      <Text className="text-xs text-muted">{label}</Text>
    </View>
  );
}

export default function PodSettings() {
  const { colors } = useTheme();
  const { podId } = useLocalSearchParams<{ podId: string }>();
  const pod = usePod(podId);
  const hub = useHub(pod?.hubId);
  const role = useMyRole(pod?.hubId);
  const stats = usePodStats(podId);
  const updatePod = useHubsStore((s) => s.updatePod);
  const deletePod = useHubsStore((s) => s.deletePod);

  const canManage = role === "owner" || role === "admin";
  const [name, setName] = useState(pod?.name ?? "");
  const [description, setDescription] = useState(pod?.description ?? "");

  if (!pod || !hub) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
        <NotFound what="Pod" />
      </SafeAreaView>
    );
  }

  const cleanName = toPodName(name);
  const nameError = cleanName.length < 2 ? "Use at least 2 letters or numbers." : null;
  const dirty = cleanName !== pod.name || description.trim() !== pod.description;

  function save() {
    if (nameError || !pod) return;
    updatePod(pod.id, { name: cleanName, description: description.trim() });
    setName(cleanName);
  }

  function confirmDelete() {
    if (!pod) return;
    Alert.alert(`Delete #${pod.name}?`, "Every message, voice note and video note in it will be removed for everyone. This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete pod",
        style: "destructive",
        onPress: () => {
          const hubId = pod.hubId;
          router.dismissTo({ pathname: "/hub/[hubId]", params: { hubId } });
          deletePod(pod.id);
        },
      },
    ]);
  }

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      <ScreenHeader title="Pod settings" subtitle={`#${pod.name} · ${hub.name}`} />

      <KeyboardAwareScrollView bottomOffset={64} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
        <View className="px-4">
          <View className="mt-5 overflow-hidden rounded-3xl border border-line bg-surface">
            <View className="flex-row items-center gap-4 p-5">
              <View className="size-16 items-center justify-center rounded-3xl bg-raised">
                {pod.isPrivate ? (
                  <Ionicons name="lock-closed" size={26} color={colors.accent} />
                ) : (
                  <Text className="text-3xl font-sans-semibold text-accent-text">#</Text>
                )}
              </View>
              <View className="flex-1">
                <Text className="font-display text-[22px] tracking-tight text-ink" numberOfLines={1}>
                  {pod.name}
                </Text>
                <Text className="mt-0.5 text-sm text-muted" numberOfLines={2}>
                  {pod.category} · {pod.isPrivate ? "Private pod" : "Open to the hub"}
                </Text>
              </View>
            </View>
            <View className="flex-row border-t border-line">
              <Stat icon="chatbubble-ellipses-outline" value={stats.messages} label="Messages" />
              <View className="my-3 w-px bg-line" />
              <Stat icon="mic-outline" value={stats.voice} label="Voice notes" />
              <View className="my-3 w-px bg-line" />
              <Stat icon="videocam-outline" value={stats.video} label="Video notes" />
            </View>
          </View>

          <SectionLabel>About</SectionLabel>
          {canManage ? (
            <View className="gap-4 rounded-3xl border border-line bg-surface p-4">
              <TextField
                label="Name"
                value={name}
                onChangeText={setName}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={40}
                error={dirty ? nameError : null}
                hint={cleanName !== name.trim() && !nameError ? `Will be saved as #${cleanName}` : "Lowercase letters, numbers and hyphens."}
              />
              <TextField
                label="Description"
                value={description}
                onChangeText={setDescription}
                multiline
                maxLength={120}
                placeholder="What is this pod for?"
                className="h-24 pt-3.5"
                textAlignVertical="top"
              />
              {dirty ? <Button label="Save changes" disabled={!!nameError} onPress={save} /> : null}
            </View>
          ) : (
            <View className="rounded-3xl border border-line bg-surface p-5">
              <Text className="text-base leading-6 text-ink">{pod.description || "No description yet."}</Text>
              <Text className="mt-3 text-sm text-muted">Only owners and admins of {hub.name} can edit this pod.</Text>
            </View>
          )}

          <SectionLabel>Notifications</SectionLabel>
          <SettingGroup>
            <SettingRow
              icon="notifications-off-outline"
              title="Mute this pod"
              toggle={{ value: pod.muted, onChange: (muted) => updatePod(pod.id, { muted }) }}
            />
            <SettingRow
              icon="at"
              title="Mentions only"
              toggle={{ value: !!pod.mentionsOnly && !pod.muted, onChange: (mentionsOnly) => updatePod(pod.id, { mentionsOnly, muted: false }) }}
              last
            />
          </SettingGroup>
          <Text className="px-2 pt-2 text-[13px] leading-5 text-muted">
            {pod.muted
              ? "You will not be notified, and the unread count stays quiet."
              : pod.mentionsOnly
                ? "You will only be notified when someone mentions you."
                : "You will be notified about every new message."}
          </Text>

          <SectionLabel>Access</SectionLabel>
          <SettingGroup>
            {canManage ? (
              <SettingRow
                icon="lock-closed-outline"
                title="Private pod"
                toggle={{ value: pod.isPrivate, onChange: (isPrivate) => updatePod(pod.id, { isPrivate }) }}
              />
            ) : (
              <SettingRow icon="lock-closed-outline" title="Visibility" value={pod.isPrivate ? "Private" : "Open"} />
            )}
            <SettingRow
              icon="people-outline"
              title="Members"
              value={pod.isPrivate ? "Invited only" : pluralize(hub.members.length, "person", "people")}
              onPress={() => router.push(`/hub/${hub.id}/members`)}
              last
            />
          </SettingGroup>

          {canManage ? (
            <>
              <SectionLabel>Danger zone</SectionLabel>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel={`Delete ${pod.name}`}
                onPress={confirmDelete}
                className="flex-row items-center gap-3.5 rounded-3xl border border-danger/40 bg-danger/10 px-4 py-4"
              >
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
                <View className="flex-1">
                  <Text className="text-base font-sans-semibold text-danger">Delete pod</Text>
                  <Text className="text-[13px] text-muted">Removes the pod and all of its messages.</Text>
                </View>
              </PressableScale>
            </>
          ) : null}
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
