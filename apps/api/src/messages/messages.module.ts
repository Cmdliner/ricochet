import { Module } from "@nestjs/common";
import { ActivityModule } from "../activity/activity.module.js";
import { AuthModule } from "../auth/auth.module.js";
import { PodsModule } from "../pods/pods.module.js";
import { RealtimeBusModule } from "../realtime/realtime-bus.module.js";
import { ConversationAccessService } from "./conversation-access.service.js";
import { MessagesController } from "./messages.controller.js";
import { MessagesService } from "./messages.service.js";
import { ReadStateService } from "./read-state.service.js";
import { UnreadController } from "./unread.controller.js";

@Module({
  imports: [ActivityModule, AuthModule, PodsModule, RealtimeBusModule],
  controllers: [MessagesController, UnreadController],
  providers: [MessagesService, ConversationAccessService, ReadStateService],
  exports: [MessagesService, ConversationAccessService, ReadStateService],
})
export class MessagesModule {}
