import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { MediaModule } from "../media/media.module.js";
import { MessagesModule } from "../messages/messages.module.js";
import { SafetyController } from "./safety.controller.js";
import { SafetyService } from "./safety.service.js";

@Module({
  imports: [AuthModule, MediaModule, MessagesModule],
  controllers: [SafetyController],
  providers: [SafetyService],
})
export class SafetyModule {}
