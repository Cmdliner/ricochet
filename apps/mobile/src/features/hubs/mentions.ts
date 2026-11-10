import { hubMemberSchema } from "@ricochet/shared";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { api } from "@/lib/api";
import { useSafetyStore } from "@/features/safety/store";
import { useAuthStore } from "@/stores/auth-store";
import { toMember } from "./adapters";
import { ME_ID, type Member } from "./types";

/**
 * A handle written as @name. The character before the @ may not be a letter, digit or underscore, so an email
 * address like ada@example.com is not a tag. The server reads tags with the same rule.
 */
const TAG = /(^|[^a-z0-9_])@([a-z0-9_]+)/gi;

export type Segment = { text: string; handle?: string };

/** Splits a message into plain stretches and tags, so the tags can be drawn differently. */
export function splitMentions(text: string): Segment[] {
  const segments: Segment[] = [];
  let last = 0;
  for (const match of text.matchAll(TAG)) {
    const prefix = match[1] ?? "";
    const handle = match[2] ?? "";
    const at = (match.index ?? 0) + prefix.length;
    if (at > last) segments.push({ text: text.slice(last, at) });
    segments.push({ text: `@${handle}`, handle: handle.toLowerCase() });
    last = at + handle.length + 1;
  }
  if (last < text.length) segments.push({ text: text.slice(last) });
  return segments;
}

export type MentionQuery = { query: string; start: number };

/** The tag being typed right before the cursor, if any. `start` is where its @ sits. */
export function activeMention(text: string, cursor: number): MentionQuery | null {
  const before = text.slice(0, cursor);
  const match = /(^|[^a-z0-9_])@([a-z0-9_]*)$/i.exec(before);
  if (!match) return null;
  const query = match[2] ?? "";
  return { query, start: before.length - query.length - 1 };
}

/** Puts the chosen person's handle in place of what was typed, with a space after it, and says where the cursor goes. */
export function insertMention(text: string, cursor: number, start: number, handle: string): { text: string; cursor: number } {
  const head = `${text.slice(0, start)}@${handle} `;
  return { text: head + text.slice(cursor), cursor: head.length };
}

const MAX_SUGGESTIONS = 6;

/** People whose handle starts with what was typed first, then people whose name does. With nothing typed yet, everyone, online first. */
export function suggestMembers(members: Member[], query: string): Member[] {
  const q = query.toLowerCase();
  const rank = (member: Member) => {
    if (q === "") return 2;
    if (member.handle.toLowerCase().startsWith(q)) return 0;
    if (member.name.toLowerCase().split(/\s+/).some((word) => word.startsWith(q))) return 1;
    return null;
  };
  return members
    .map((member) => ({ member, rank: rank(member) }))
    .filter((entry): entry is { member: Member; rank: number } => entry.rank !== null)
    .sort((a, b) => a.rank - b.rank || Number(b.member.online) - Number(a.member.online) || a.member.name.localeCompare(b.member.name))
    .slice(0, MAX_SUGGESTIONS)
    .map((entry) => entry.member);
}

/**
 * Who can be tagged in a pod: the people who can see it, asked of the server so a private pod only offers its own
 * members. Leaves out yourself and anyone you blocked.
 */
export function useMentionables(podId: string | undefined): Member[] {
  const [people, setPeople] = useState<Member[]>([]);
  const blocked = useSafetyStore((s) => s.blocked);

  useEffect(() => {
    if (!podId) return;
    let cancelled = false;
    api(`/pods/${podId}/members`, { auth: true, schema: z.array(hubMemberSchema) })
      .then((rows) => {
        if (cancelled) return;
        const me = useAuthStore.getState().user?.id;
        setPeople(rows.map((row) => toMember({ id: row.userId, ...row }, me)));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [podId]);

  return useMemo(() => people.filter((person) => person.id !== ME_ID && !blocked.some((b) => b.id === person.id)), [people, blocked]);
}
