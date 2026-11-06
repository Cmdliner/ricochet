import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { RealtimeBusModule } from "../realtime/realtime-bus.module.js";
import { ChatsController } from "./chats.controller.js";
import { ChatsService } from "./chats.service.js";
import { PeopleService } from "./people.service.js";

@Module({
  imports: [AuthModule, RealtimeBusModule],
  controllers: [ChatsController],
  providers: [ChatsService, PeopleService],
  exports: [ChatsService],
})
export class ChatsModule {}
