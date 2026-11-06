import { Controller, Get, UseGuards } from "@nestjs/common";
import type { UnreadSummary } from "@ricochet/shared";
import { ActivityService } from "../activity/activity.service.js";
import { Auth, AuthGuard, type AuthContext } from "../auth/auth.guard.js";
import { ReadStateService } from "./read-state.service.js";

@UseGuards(AuthGuard)
@Controller("unread")
export class UnreadController {
  constructor(
    private readonly readState: ReadStateService,
    private readonly activity: ActivityService,
  ) {}

  /** Everything the badges need in one call: the app asks this on launch and after reconnecting, then follows the live events. */
  @Get()
  async summary(@Auth() auth: AuthContext): Promise<UnreadSummary> {
    const [conversations, activity] = await Promise.all([
      this.readState.listUnread(auth.userId),
      this.activity.unreadFor(auth.userId),
    ]);
    return { conversations, activity };
  }
}
