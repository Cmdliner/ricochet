import { Body, Controller, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, UseGuards } from "@nestjs/common";
import { inviteToHubSchema, type InviteToHubInput } from "@ricochet/shared";
import { Auth, AuthGuard, type AuthContext } from "../auth/auth.guard.js";
import { ZodValidationPipe } from "../common/zod-validation.pipe.js";
import { ActivityService } from "./activity.service.js";

@UseGuards(AuthGuard)
@Controller("hubs/:hubId/invites")
export class InvitesController {
  constructor(private readonly activity: ActivityService) {}

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  async invite(
    @Auth() auth: AuthContext,
    @Param("hubId", ParseUUIDPipe) hubId: string,
    @Body(new ZodValidationPipe(inviteToHubSchema)) body: InviteToHubInput,
  ) {
    await this.activity.invite(auth.userId, hubId, body.userId);
  }
}
