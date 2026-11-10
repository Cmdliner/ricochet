import { blocks } from "@ricochet/db";
import { and, eq } from "drizzle-orm";
import type { Database } from "../db/db.module.js";

/**
 * Who blocked whom, as plain functions over the database. Any service that decides who sees or hears something can
 * ask without depending on a module, which keeps blocking from becoming a tangle of imports.
 */
export async function usersBlockedBy(db: Pick<Database, "select">, userId: string): Promise<string[]> {
  const rows = await db.select({ id: blocks.blockedId }).from(blocks).where(eq(blocks.blockerId, userId));
  return rows.map((row) => row.id);
}

export async function usersWhoBlocked(db: Pick<Database, "select">, userId: string): Promise<string[]> {
  const rows = await db.select({ id: blocks.blockerId }).from(blocks).where(eq(blocks.blockedId, userId));
  return rows.map((row) => row.id);
}

export async function hasBlocked(db: Pick<Database, "select">, blockerId: string, blockedId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: blocks.blockerId })
    .from(blocks)
    .where(and(eq(blocks.blockerId, blockerId), eq(blocks.blockedId, blockedId)))
    .limit(1);
  return row !== undefined;
}
