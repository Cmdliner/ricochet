import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { HubsModule } from "../hubs/hubs.module.js";
import { PodsController } from "./pods.controller.js";
import { PodsService } from "./pods.service.js";

@Module({
  imports: [AuthModule, HubsModule],
  controllers: [PodsController],
  providers: [PodsService],
  exports: [PodsService],
})
export class PodsModule {}
