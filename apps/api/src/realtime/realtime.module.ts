import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { HubsModule } from "../hubs/hubs.module.js";
import { MessagesModule } from "../messages/messages.module.js";
import { PresenceController } from "./presence.controller.js";
import { PresenceService } from "./presence.service.js";
import { RealtimeBusModule } from "./realtime-bus.module.js";
import { RoomRevalidator } from "./room-revalidator.js";
import { RealtimeGateway } from "./realtime.gateway.js";

@Module({ imports: [AuthModule, HubsModule, MessagesModule, RealtimeBusModule],
  controllers: [PresenceController],
  providers: [RealtimeGateway, RoomRevalidator, PresenceService], })
export class RealtimeModule {}
