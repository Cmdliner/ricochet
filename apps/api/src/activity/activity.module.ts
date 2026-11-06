import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { RealtimeBusModule } from "../realtime/realtime-bus.module.js";
import { ActivityController } from "./activity.controller.js";
import { ActivityService } from "./activity.service.js";

@Module({
  imports: [AuthModule, RealtimeBusModule],
  controllers: [ActivityController],
  providers: [ActivityService],
  exports: [ActivityService],
})
export class ActivityModule {}
