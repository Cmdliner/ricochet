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
  addPodMemberSchema,
  createPodSchema,
  podSettingsSchema,
  updatePodSchema,
  type AddPodMemberInput,
  type CreatePodInput,
  type PodSettingsInput,
  type UpdatePodInput,
} from "@ricochet/shared";
import { Auth, AuthGuard, type AuthContext } from "../auth/auth.guard.js";
import { ZodValidationPipe } from "../common/zod-validation.pipe.js";
import { PodsService } from "./pods.service.js";

@UseGuards(AuthGuard)
@Controller()
export class PodsController {
  constructor(private readonly pods: PodsService) {}

  @Get("hubs/:hubId/pods")
  list(@Auth() auth: AuthContext, @Param("hubId", ParseUUIDPipe) hubId: string) {
    return this.pods.listForHub(auth.userId, hubId);
  }

  @Post("hubs/:hubId/pods")
  create(
    @Auth() auth: AuthContext,
    @Param("hubId", ParseUUIDPipe) hubId: string,
    @Body(new ZodValidationPipe(createPodSchema)) body: CreatePodInput,
  ) {
    return this.pods.create(auth.userId, hubId, body);
  }

  @Get("pods/:podId")
  get(@Auth() auth: AuthContext, @Param("podId", ParseUUIDPipe) podId: string) {
    return this.pods.get(auth.userId, podId);
  }

  @Patch("pods/:podId")
  update(
    @Auth() auth: AuthContext,
    @Param("podId", ParseUUIDPipe) podId: string,
    @Body(new ZodValidationPipe(updatePodSchema)) body: UpdatePodInput,
  ) {
    return this.pods.update(auth.userId, podId, body);
  }

  @Delete("pods/:podId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Auth() auth: AuthContext, @Param("podId", ParseUUIDPipe) podId: string) {
    await this.pods.remove(auth.userId, podId);
  }

  @Patch("pods/:podId/me")
  updateSettings(
    @Auth() auth: AuthContext,
    @Param("podId", ParseUUIDPipe) podId: string,
    @Body(new ZodValidationPipe(podSettingsSchema)) body: PodSettingsInput,
  ) {
    return this.pods.updateSettings(auth.userId, podId, body);
  }

  @Get("pods/:podId/members")
  members(@Auth() auth: AuthContext, @Param("podId", ParseUUIDPipe) podId: string) {
    return this.pods.listMembers(auth.userId, podId);
  }

  @Post("pods/:podId/members")
  @HttpCode(HttpStatus.NO_CONTENT)
  async addMember(
    @Auth() auth: AuthContext,
    @Param("podId", ParseUUIDPipe) podId: string,
    @Body(new ZodValidationPipe(addPodMemberSchema)) body: AddPodMemberInput,
  ) {
    await this.pods.addMember(auth.userId, podId, body.userId);
  }

  @Delete("pods/:podId/members/:userId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(
    @Auth() auth: AuthContext,
    @Param("podId", ParseUUIDPipe) podId: string,
    @Param("userId", ParseUUIDPipe) userId: string,
  ) {
    await this.pods.removeMember(auth.userId, podId, userId);
  }
}
