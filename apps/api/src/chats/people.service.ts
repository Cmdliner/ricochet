import { Inject, Injectable } from "@nestjs/common";
import { hubMembers, users } from "@ricochet/db";
import type { PersonResult } from "@ricochet/shared";
import { and, asc, eq, ilike, inArray, isNotNull, ne, or } from "drizzle-orm";
import { DRIZZLE, type Database } from "../db/db.module.js";
import { escapeLike } from "./like-pattern.js";

const RESULT_LIMIT = 20;

const columns = {
  id: users.id,
  displayName: users.displayName,
  handle: users.handle,
  avatarColor: users.avatarColor,
};

@Injectable()
export class PeopleService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  /**
   * People in your hubs are found by name or the start of a handle. Anyone else is found only by typing their
   * exact handle, so a stranger cannot be browsed or guessed at from a few letters.
   */
  async search(userId: string, query: string): Promise<PersonResult[]> {
    const pattern = escapeLike(query);
    const myHubs = this.db.select({ id: hubMembers.hubId }).from(hubMembers).where(eq(hubMembers.userId, userId));

    const mates = await this.db
      .selectDistinct(columns)
      .from(users)
      .innerJoin(hubMembers, eq(hubMembers.userId, users.id))
      .where(
        and(
          inArray(hubMembers.hubId, myHubs),
          ne(users.id, userId),
          isNotNull(users.profileCompletedAt),
          or(ilike(users.displayName, `%${pattern}%`), ilike(users.handle, `${pattern}%`)),
        ),
      )
      .orderBy(asc(users.displayName))
      .limit(RESULT_LIMIT);

    const exact = query.toLowerCase();
    const results: PersonResult[] = mates.map((person) => ({ ...person, via: "hub" as const }));
    results.sort((a, b) => Number(b.handle === exact) - Number(a.handle === exact));

    if (!results.some((person) => person.handle === exact)) {
      const [stranger] = await this.db
        .select(columns)
        .from(users)
        .where(and(eq(users.handle, exact), ne(users.id, userId), isNotNull(users.profileCompletedAt)))
        .limit(1);
      if (stranger) results.unshift({ ...stranger, via: "handle" });
    }
    return results;
  }
}
