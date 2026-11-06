import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { HubsController } from "./hubs.controller.js";
import { HubsService } from "./hubs.service.js";

@Module({
  // AuthModule exports the guard and the JWT service the guard needs.
  imports: [AuthModule],
  controllers: [HubsController],
  providers: [HubsService],
  exports: [HubsService],
})
export class HubsModule {}
