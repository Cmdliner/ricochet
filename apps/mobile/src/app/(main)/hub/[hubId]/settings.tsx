import { Ionicons } from "@expo/vector-icons";
import { updateHubSchema, type HubColor, type HubIcon } from "@ricochet/shared";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Share, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar } from "@/components/ui/avatar";
import { HubAvatar } from "@/components/ui/hub-avatar";
import { HubIconPicker } from "@/components/ui/hub-icon-picker";
import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/ui/color-picker";
import { NotFound } from "@/components/ui/not-found";
import { PressableScale } from "@/components/ui/pressable-scale";
import { ScreenHeader } from "@/components/ui/screen-header";
import { SectionLabel } from "@/components/ui/section-label";
import { Text } from "@/components/ui/text";
import { TextField } from "@/components/ui/text-field";
import { useMyRole } from "@/features/hubs/hooks";
import { useHub, useHubsStore } from "@/features/hubs/store";
import { showError } from "@/lib/notify";
import { ME_ID, type Role } from "@/features/hubs/types";
import { useTheme } from "@/theme/theme-provider";

const ROLE_ORDER: Record<Role, number> = { owner: 0, admin: 1, member: 2 };

export default function HubSettings() {
  const { colors } = useTheme();
  const { hubId } = useLocalSearchParams<{ hubId: string }>();
  const hub = useHub(hubId);
  const role = useMyRole(hubId);
  const people = useHubsStore((s) => s.members);
  const updateHub = useHubsStore((s) => s.updateHub);
  const regenerateInviteCode = useHubsStore((s) => s.regenerateInviteCode);
  const setMemberRole = useHubsStore((s) => s.setMemberRole);
  const removeMember = useHubsStore((s) => s.removeMember);
  const deleteHub = useHubsStore((s) => s.deleteHub);
  const leaveHub = useHubsStore((s) => s.leaveHub);

  const [name, setName] = useState(hub?.name ?? "");
  const [description, setDescription] = useState(hub?.description ?? "");
  const [color, setColor] = useState<HubColor>(hub?.color ?? "coral");
  const [icon, setIcon] = useState<HubIcon>(hub?.icon ?? "rocket");
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({});

  const rows = useMemo(
    () =>
      (hub?.members ?? [])
        .map((entry) => ({ role: entry.role, member: people[entry.id] }))
        .filter((row): row is { role: Role; member: NonNullable<typeof row.member> } => !!row.member)
        .sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role] || a.member.name.localeCompare(b.member.name)),
    [hub, people],
  );

  if (!hub) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
        <NotFound what="Hub" />
      </SafeAreaView>
    );
  }

  if (role !== "owner" && role !== "admin") {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
        <ScreenHeader title="Hub settings" subtitle={hub.name} />
        <View className="flex-1 items-center justify-center gap-3 px-10">
          <View className="size-16 items-center justify-center rounded-full bg-raised">
            <Ionicons name="lock-closed" size={26} color={colors.muted} />
          </View>
          <Text className="font-display text-[22px] text-ink">Only admins can change this</Text>
          <Text className="text-center text-muted">Ask an owner or admin of {hub.name} if something needs to change.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isOwner = role === "owner";
  const dirty = name.trim() !== hub.name || description.trim() !== hub.description || color !== hub.color || icon !== hub.icon;

  async function save() {
    if (!hub) return;
    const parsed = updateHubSchema.safeParse({ name, description, color, icon });
    if (!parsed.success) {
      const next: typeof errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === "name" || key === "description") next[key] ??= issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    try {
      await updateHub(hub.id, parsed.data);
      setName(parsed.data.name);
      setDescription(parsed.data.description);
    } catch (caught) {
      showError(caught, "Could not save");
    }
  }

  const attempt = (work: () => Promise<unknown>) => work().catch((caught: unknown) => showError(caught));

  const share = (code: string) =>
    Share.share({ message: `Join ${hub.name} on Ricochet with the code ${code}. https://ricochet.app/i/${code}` });

  function confirmNewCode() {
    if (!hub) return;
    Alert.alert("Generate a new code?", "The current code will stop working. People already in the hub stay in it.", [
      { text: "Cancel", style: "cancel" },
      { text: "Generate", onPress: () => attempt(() => regenerateInviteCode(hub.id)) },
    ]);
  }

  function manage(memberId: string, memberName: string, memberRole: Role) {
    if (!hub || memberId === ME_ID || memberRole === "owner") return;
    const actions: { text: string; style?: "destructive"; onPress: () => void }[] = [];
    if (isOwner) {
      actions.push(
        memberRole === "admin"
          ? { text: "Make a regular member", onPress: () => attempt(() => setMemberRole(hub.id, memberId, "member")) }
          : { text: "Make an admin", onPress: () => attempt(() => setMemberRole(hub.id, memberId, "admin")) },
      );
    }
    if (isOwner || memberRole === "member") {
      actions.push({
        text: "Remove from hub",
        style: "destructive",
        onPress: () =>
          Alert.alert(`Remove ${memberName}?`, `${memberName} will lose access to ${hub.name}.`, [
            { text: "Cancel", style: "cancel" },
            { text: "Remove", style: "destructive", onPress: () => attempt(() => removeMember(hub.id, memberId)) },
          ]),
      });
    }
    if (actions.length === 0) return;
    Alert.alert(memberName, undefined, [...actions, { text: "Cancel", style: "cancel", onPress: () => undefined }]);
  }

  function confirmDelete() {
    if (!hub) return;
    Alert.alert(`Delete ${hub.name}?`, "Every pod and message in this hub will be removed for everyone. This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete hub",
        style: "destructive",
        onPress: () =>
          attempt(async () => {
            await deleteHub(hub.id);
            router.replace("/");
          }),
      },
    ]);
  }

  function confirmLeave() {
    if (!hub) return;
    Alert.alert(`Leave ${hub.name}?`, "You will lose access to its pods. You can join again with an invite code.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave hub",
        style: "destructive",
        onPress: () =>
          attempt(async () => {
            await leaveHub(hub.id);
            router.replace("/");
          }),
      },
    ]);
  }

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      <ScreenHeader title="Hub settings" subtitle={hub.name} />

      <KeyboardAwareScrollView bottomOffset={64} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
        <View className="px-4">
          <SectionLabel>Identity</SectionLabel>
          <View className="gap-5 rounded-3xl border border-line bg-surface p-4">
            <View className="flex-row items-center gap-4">
              <HubAvatar name={name || "?"} color={color} icon={icon} size={64} />
              <View className="flex-1">
                <TextField
                  label="Hub name"
                  value={name}
                  onChangeText={(value) => {
                    setName(value);
                    if (errors.name) setErrors((e) => ({ ...e, name: undefined }));
                  }}
                  maxLength={40}
                  error={errors.name}
                />
              </View>
            </View>
            <TextField
              label="Description"
              value={description}
              onChangeText={(value) => {
                setDescription(value);
                if (errors.description) setErrors((e) => ({ ...e, description: undefined }));
              }}
              multiline
              maxLength={160}
              placeholder="What is this hub about?"
              className="h-24 pt-3.5"
              textAlignVertical="top"
              error={errors.description}
            />
            <View className="gap-3">
              <Text className="text-[13px] font-sans-semibold tracking-wide text-muted">Colour</Text>
              <ColorPicker value={color} onChange={setColor} />
            </View>
            <View className="gap-3">
              <Text className="text-[13px] font-sans-semibold tracking-wide text-muted">Picture</Text>
              <HubIconPicker value={icon} onChange={setIcon} color={color} name={name || "?"} />
            </View>
            {dirty ? <Button label="Save changes" onPress={save} /> : null}
          </View>

          <SectionLabel>Invite code</SectionLabel>
          <View className="rounded-3xl border border-dashed border-line bg-surface p-5">
            <Text className="font-display text-[28px] tracking-[5px] text-ink">{hub.inviteCode}</Text>
            <Text className="mt-1 text-[13px] text-muted">Anyone with this code can join {hub.name}.</Text>
            <View className="mt-4 flex-row gap-2">
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Share the invite code"
                onPress={() => share(hub.inviteCode)}
                containerStyle={{ flex: 1 }}
                className="h-11 w-full flex-row items-center justify-center gap-2 rounded-full bg-accent"
              >
                <Ionicons name="share-outline" size={18} color={colors.accentInk} />
                <Text className="text-sm font-sans-semibold text-accent-ink">Share</Text>
              </PressableScale>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Generate a new invite code"
                onPress={confirmNewCode}
                containerStyle={{ flex: 1 }}
                className="h-11 w-full flex-row items-center justify-center gap-2 rounded-full border border-line"
              >
                <Ionicons name="refresh" size={17} color={colors.ink} />
                <Text className="text-sm font-sans-semibold text-ink">New code</Text>
              </PressableScale>
            </View>
          </View>

          <SectionLabel>{`Members · ${rows.length}`}</SectionLabel>
          <View className="overflow-hidden rounded-3xl border border-line bg-surface">
            {rows.map(({ member, role: memberRole }, index) => {
              const canManage = member.id !== ME_ID && memberRole !== "owner" && (isOwner || memberRole === "member");
              return (
                <View key={member.id}>
                  {index > 0 ? <View className="ml-[72px] h-px bg-line" /> : null}
                  <PressableScale
                    accessibilityRole="button"
                    accessibilityLabel={`${member.name}, ${memberRole}${canManage ? ". Manage" : ""}`}
                    disabled={!canManage}
                    scaleTo={0.99}
                    onPress={() => manage(member.id, member.name, memberRole)}
                    className="flex-row items-center gap-3.5 px-4 py-3"
                  >
                    <Avatar name={member.name} color={member.color} size={42} />
                    <View className="flex-1">
                      <Text className="text-[16px] font-sans-semibold text-ink" numberOfLines={1}>
                        {member.id === ME_ID ? "You" : member.name}
                      </Text>
                      <Text className="text-[13px] text-muted" numberOfLines={1}>
                        @{member.handle}
                      </Text>
                    </View>
                    {memberRole !== "member" ? (
                      <View className="rounded-full bg-raised px-3 py-1">
                        <Text className="text-xs font-sans-semibold text-muted capitalize">{memberRole}</Text>
                      </View>
                    ) : null}
                    {canManage ? <Ionicons name="ellipsis-horizontal" size={18} color={colors.muted} /> : null}
                  </PressableScale>
                </View>
              );
            })}
          </View>
          <Text className="px-2 pt-2 text-[13px] leading-5 text-muted">
            {isOwner ? "Tap a person to change their role or remove them." : "Tap a member to remove them. Only the owner can change roles."}
          </Text>

          <SectionLabel>Danger zone</SectionLabel>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={isOwner ? `Delete ${hub.name}` : `Leave ${hub.name}`}
            onPress={isOwner ? confirmDelete : confirmLeave}
            className="flex-row items-center gap-3.5 rounded-3xl border border-danger/40 bg-danger/10 px-4 py-4"
          >
            <Ionicons name={isOwner ? "trash-outline" : "exit-outline"} size={20} color={colors.danger} />
            <View className="flex-1">
              <Text className="text-base font-sans-semibold text-danger">{isOwner ? "Delete hub" : "Leave hub"}</Text>
              <Text className="text-[13px] text-muted">
                {isOwner ? "Removes the hub, its pods and every message." : "You can rejoin later with an invite code."}
              </Text>
            </View>
          </PressableScale>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
