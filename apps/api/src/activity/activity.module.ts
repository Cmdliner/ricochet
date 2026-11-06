import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { PushModule } from "../push/push.module.js";
import { HubsModule } from "../hubs/hubs.module.js";
import { RealtimeBusModule } from "../realtime/realtime-bus.module.js";
import { ActivityController } from "./activity.controller.js";
import { ActivityService } from "./activity.service.js";
import { InvitesController } from "./invites.controller.js";

@Module({
  imports: [AuthModule, HubsModule, PushModule, RealtimeBusModule],
  controllers: [ActivityController, InvitesController],
  providers: [ActivityService],
  exports: [ActivityService],
})
export class ActivityModule {}
