import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { RealtimeBusModule } from "../realtime/realtime-bus.module.js";
import { HubsController } from "./hubs.controller.js";
import { HubsService } from "./hubs.service.js";

@Module({
  imports: [AuthModule, RealtimeBusModule],
  controllers: [HubsController],
  providers: [HubsService],
  exports: [HubsService],
})
export class HubsModule {}
