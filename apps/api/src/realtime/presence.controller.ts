import { Controller, Get, NotFoundException, Param, ParseUUIDPipe, UseGuards } from "@nestjs/common";
import { Auth, AuthGuard, type AuthContext } from "../auth/auth.guard.js";
import { HubsService } from "../hubs/hubs.service.js";
import { PresenceService } from "./presence.service.js";

@UseGuards(AuthGuard)
@Controller()
export class PresenceController {
  constructor(
    private readonly presence: PresenceService,
    private readonly hubs: HubsService,
  ) {}

  @Get("hubs/:hubId/presence")
  async online(@Auth() auth: AuthContext, @Param("hubId", ParseUUIDPipe) hubId: string) {
    if (!(await this.hubs.roleOf(hubId, auth.userId))) throw new NotFoundException("Hub not found.");
    return { online: await this.presence.onlineInHub(hubId) };
  }
}
