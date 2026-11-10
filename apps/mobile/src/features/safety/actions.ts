import { router } from "expo-router";
import { showDialog } from "@/lib/dialog";
import { showError } from "@/lib/notify";
import type { Member } from "@/features/hubs/types";
import { useSafetyStore } from "./store";

type ReportTarget = { member: Member; messageId?: string };

export function openReport({ member, messageId }: ReportTarget) {
  router.push({ pathname: "/report", params: { userId: member.id, name: member.name, ...(messageId ? { messageId } : {}) } });
}

/** Asks first, because the person is not told and the whole conversation with them goes quiet. */
export function confirmBlock(member: Member, afterBlock?: () => void) {
  showDialog(`Block ${member.name}?`, "You will stop seeing their messages and they cannot write to you. They are not told that you blocked them. You can unblock them any time from your profile.", [
    { text: "Cancel", style: "cancel" },
    {
      text: "Block",
      style: "destructive",
      onPress: () => {
        useSafetyStore
          .getState()
          .block(member)
          .then(afterBlock)
          .catch((error: unknown) => showError(error, "Could not block"));
      },
    },
  ]);
}

export function confirmUnblock(member: Member) {
  useSafetyStore
    .getState()
    .unblock(member)
    .catch((error: unknown) => showError(error, "Could not unblock"));
}

/** What can be done about a person, from a chat header or the member list. */
export function showPersonActions(member: Member, afterBlock?: () => void) {
  showDialog(member.name, `@${member.handle}`, [
    { text: "Report", onPress: () => openReport({ member }) },
    { text: "Block", style: "destructive", onPress: () => confirmBlock(member, afterBlock) },
    { text: "Cancel", style: "cancel" },
  ]);
}
