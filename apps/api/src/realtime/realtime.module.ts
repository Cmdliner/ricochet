import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { MessagesModule } from "../messages/messages.module.js";
import { RealtimeBusModule } from "./realtime-bus.module.js";
import { RoomRevalidator } from "./room-revalidator.js";
import { RealtimeGateway } from "./realtime.gateway.js";

@Module({ imports: [AuthModule, MessagesModule, RealtimeBusModule], providers: [RealtimeGateway, RoomRevalidator] })
export class RealtimeModule {}
