import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { PodsModule } from "../pods/pods.module.js";
import { RealtimeBusModule } from "../realtime/realtime-bus.module.js";
import { MessagesController } from "./messages.controller.js";
import { MessagesService } from "./messages.service.js";

@Module({
  imports: [AuthModule, PodsModule, RealtimeBusModule],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
