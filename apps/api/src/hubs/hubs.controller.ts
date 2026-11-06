import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  createHubSchema,
  joinHubSchema,
  patchHubSchema,
  setMemberRoleSchema,
  type CreateHubInput,
  type JoinHubInput,
  type PatchHubInput,
  type SetMemberRoleInput,
} from "@ricochet/shared";
import { Auth, AuthGuard, type AuthContext } from "../auth/auth.guard.js";
import { ZodValidationPipe } from "../common/zod-validation.pipe.js";
import { HubsService } from "./hubs.service.js";

@UseGuards(AuthGuard)
@Controller("hubs")
export class HubsController {
  constructor(private readonly hubs: HubsService) {}

  @Get()
  list(@Auth() auth: AuthContext) {
    return this.hubs.listMine(auth.userId);
  }

  @Post()
  create(@Auth() auth: AuthContext, @Body(new ZodValidationPipe(createHubSchema)) body: CreateHubInput) {
    return this.hubs.create(auth.userId, body);
  }

  // Declared before the ":hubId" routes so the word "join" is never mistaken for an id.
  @Post("join")
  @HttpCode(HttpStatus.OK)
  join(@Auth() auth: AuthContext, @Body(new ZodValidationPipe(joinHubSchema)) body: JoinHubInput) {
    return this.hubs.join(auth.userId, body.code);
  }

  @Get(":hubId")
  get(@Auth() auth: AuthContext, @Param("hubId", ParseUUIDPipe) hubId: string) {
    return this.hubs.getView(auth.userId, hubId);
  }

  @Patch(":hubId")
  update(
    @Auth() auth: AuthContext,
    @Param("hubId", ParseUUIDPipe) hubId: string,
    @Body(new ZodValidationPipe(patchHubSchema)) body: PatchHubInput,
  ) {
    return this.hubs.update(auth.userId, hubId, body);
  }

  @Delete(":hubId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Auth() auth: AuthContext, @Param("hubId", ParseUUIDPipe) hubId: string) {
    await this.hubs.remove(auth.userId, hubId);
  }

  @Post(":hubId/leave")
  @HttpCode(HttpStatus.NO_CONTENT)
  async leave(@Auth() auth: AuthContext, @Param("hubId", ParseUUIDPipe) hubId: string) {
    await this.hubs.leave(auth.userId, hubId);
  }

  @Post(":hubId/invite-code")
  @HttpCode(HttpStatus.OK)
  regenerateInviteCode(@Auth() auth: AuthContext, @Param("hubId", ParseUUIDPipe) hubId: string) {
    return this.hubs.regenerateInviteCode(auth.userId, hubId);
  }

  @Get(":hubId/members")
  members(@Auth() auth: AuthContext, @Param("hubId", ParseUUIDPipe) hubId: string) {
    return this.hubs.listMembers(auth.userId, hubId);
  }

  @Patch(":hubId/members/:userId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async setRole(
    @Auth() auth: AuthContext,
    @Param("hubId", ParseUUIDPipe) hubId: string,
    @Param("userId", ParseUUIDPipe) userId: string,
    @Body(new ZodValidationPipe(setMemberRoleSchema)) body: SetMemberRoleInput,
  ) {
    await this.hubs.setRole(auth.userId, hubId, userId, body.role);
  }

  @Delete(":hubId/members/:userId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(
    @Auth() auth: AuthContext,
    @Param("hubId", ParseUUIDPipe) hubId: string,
    @Param("userId", ParseUUIDPipe) userId: string,
  ) {
    await this.hubs.removeMember(auth.userId, hubId, userId);
  }
}
