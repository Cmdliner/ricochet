import { Module } from "@nestjs/common";
import { RealtimeBus } from "./realtime-bus.js";

@Module({ providers: [RealtimeBus], exports: [RealtimeBus] })
export class RealtimeBusModule {}
