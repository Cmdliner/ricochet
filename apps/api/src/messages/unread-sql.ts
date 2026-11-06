import { sql, type SQL } from "drizzle-orm";

export type UnreadRow = { userId: string; conversationId: string; unread: number };

type Filter = { userId?: string; conversationId?: string; exceptUserId?: string };

/**
 * One definition of "who is in which conversation and how many messages are unread for them", used by the
 * badge on every new message, the read receipt and the unread list, so the three can never disagree.
 *
 * With no read pointer yet, only messages from after the person joined count, so a new member does not
 * start with the whole history unread. An open pod counts from the hub join, a private pod or chat from the
 * moment they were added.
 */
export function unreadCounts(filter: Filter): SQL {
  const podUser = filter.userId ? sql`and hm.user_id = ${filter.userId}` : sql``;
  const podSkip = filter.exceptUserId ? sql`and hm.user_id <> ${filter.exceptUserId}` : sql``;
  const podConversation = filter.conversationId ? sql`and c.id = ${filter.conversationId}` : sql``;
  const chatUser = filter.userId ? sql`and p.user_id = ${filter.userId}` : sql``;
  const chatSkip = filter.exceptUserId ? sql`and p.user_id <> ${filter.exceptUserId}` : sql``;
  const chatConversation = filter.conversationId ? sql`and c.id = ${filter.conversationId}` : sql``;

  return sql`
    select v.user_id as "userId", v.conversation_id as "conversationId", (
      select count(*)::int from messages m
      where m.conversation_id = v.conversation_id
        and m.sender_id <> v.user_id
        and (case when v.last_read_id is not null then m.id > v.last_read_id else m.created_at >= v.since end)
    ) as unread
    from (
      select hm.user_id, c.id as conversation_id, p.last_read_id,
        case when c.is_private then p.joined_at else hm.joined_at end as since
      from conversations c
      join hub_members hm on hm.hub_id = c.hub_id
      left join participants p on p.conversation_id = c.id and p.user_id = hm.user_id
      where c.type = 'pod' and (not c.is_private or p.user_id is not null)
        ${podUser} ${podSkip} ${podConversation}
      union all
      select p.user_id, c.id, p.last_read_id, p.joined_at
      from conversations c
      join participants p on p.conversation_id = c.id
      where c.type <> 'pod' ${chatUser} ${chatSkip} ${chatConversation}
    ) v`;
}
