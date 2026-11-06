import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { View } from "react-native";
import { Avatar } from "@/components/ui/avatar";
import { HubAvatar } from "@/components/ui/hub-avatar";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Text } from "@/components/ui/text";
import { formatListTime } from "@/features/hubs/format";
import { useHubsStore } from "@/features/hubs/store";
import { useTheme } from "@/theme/theme-provider";
import { useActivityStore, type AppNotification, type NotificationKind } from "./store";

const KIND: Record<NotificationKind, { icon: keyof typeof Ionicons.glyphMap }> = {
  mention: { icon: "at" },
  reply: { icon: "return-up-back" },
  reaction: { icon: "heart" },
  invite: { icon: "mail" },
  announcement: { icon: "megaphone" },
};

function Headline({ note }: { note: AppNotification }) {
  const actor = useHubsStore((s) => (note.actorId ? s.members[note.actorId] : undefined));
  const hub = useHubsStore((s) => s.hubs.find((h) => h.id === note.hubId));
  const pod = useHubsStore((s) => s.pods.find((p) => p.id === note.podId));
  const who = actor?.name.split(" ")[0] ?? hub?.name ?? "Someone";
  const bold = "font-sans-semibold text-ink";
  const where = pod ? (
    <Text className={bold}>#{pod.name}</Text>
  ) : null;

  switch (note.kind) {
    case "mention":
      return (
        <Text className="text-[15px] leading-5 text-muted">
          <Text className={bold}>{who}</Text> mentioned you in {where}
        </Text>
      );
    case "reply":
      return (
        <Text className="text-[15px] leading-5 text-muted">
          <Text className={bold}>{who}</Text> replied to you in {where}
        </Text>
      );
    case "reaction":
      return (
        <Text className="text-[15px] leading-5 text-muted">
          <Text className={bold}>{who}</Text> reacted {note.emoji} to your message in {where}
        </Text>
      );
    case "invite":
      return (
        <Text className="text-[15px] leading-5 text-muted">
          <Text className={bold}>{who}</Text> invited you to join <Text className={bold}>{note.hubName}</Text>
        </Text>
      );
    case "announcement":
      return (
        <Text className="text-[15px] leading-5 text-muted">
          New announcement in <Text className={bold}>{hub?.name}</Text>
        </Text>
      );
  }
}

export function NotificationRow({ note }: { note: AppNotification }) {
  const { colors } = useTheme();
  const markRead = useActivityStore((s) => s.markRead);
  const respond = useActivityStore((s) => s.respondToInvite);
  const actor = useHubsStore((s) => (note.actorId ? s.members[note.actorId] : undefined));
  const hub = useHubsStore((s) => s.hubs.find((h) => h.id === note.hubId));
  const isInvite = note.kind === "invite";

  function open() {
    markRead(note.id);
    if (isInvite) return;
    if (note.podId) router.push(`/pod/${note.podId}`);
  }

  return (
    <View className={`rounded-3xl px-3 py-3.5 ${note.read ? "" : "bg-surface"}`}>
      {/* The tappable part. The invite buttons below sit outside it so taps never compete. */}
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`${note.read ? "" : "Unread. "}${note.kind}`}
        scaleTo={0.985}
        onPress={open}
        className="flex-row gap-3.5"
      >
        <View>
          {actor ? (
            <Avatar name={actor.name} color={actor.color} size={50} />
          ) : hub ? (
            <HubAvatar name={hub.name} color={hub.color} icon={hub.icon} size={50} />
          ) : null}
          <View className="absolute -right-1 -bottom-1 size-6 items-center justify-center rounded-full border-2 border-canvas bg-accent">
            <Ionicons name={KIND[note.kind].icon} size={12} color={colors.accentInk} />
          </View>
        </View>

        <View className="flex-1 gap-1.5">
          <View className="flex-row items-start gap-2">
            <View className="flex-1">
              <Headline note={note} />
            </View>
            <Text className="pt-0.5 text-xs text-muted">{formatListTime(note.at)}</Text>
          </View>

          {note.preview ? (
            <View className="rounded-2xl bg-raised px-3.5 py-2.5">
              <Text className="text-[14px] leading-5 text-ink" numberOfLines={2}>
                {note.preview}
              </Text>
            </View>
          ) : null}
        </View>

        {note.read ? null : <View className="mt-2 size-2.5 rounded-full bg-accent" />}
      </PressableScale>

      {isInvite ? (
        <View className="mt-3 ml-16">
          {note.invite === "pending" ? (
            <View className="flex-row gap-2">
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel={`Accept invite to ${note.hubName}`}
                onPress={() => respond(note.id, true)}
                className="h-10 items-center justify-center rounded-full bg-accent px-6"
              >
                <Text className="text-sm font-sans-semibold text-accent-ink">Accept</Text>
              </PressableScale>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Decline invite"
                onPress={() => respond(note.id, false)}
                className="h-10 items-center justify-center rounded-full border border-line px-6"
              >
                <Text className="text-sm font-sans-semibold text-ink">Decline</Text>
              </PressableScale>
            </View>
          ) : (
            <View className="flex-row items-center gap-1.5">
              <Ionicons
                name={note.invite === "accepted" ? "checkmark-circle" : "close-circle"}
                size={16}
                color={note.invite === "accepted" ? colors.online : colors.muted}
              />
              <Text className="text-sm text-muted">{note.invite === "accepted" ? `You joined ${note.hubName}` : "Invite declined"}</Text>
            </View>
          )}
        </View>
      ) : null}
    </View>
  );
}
