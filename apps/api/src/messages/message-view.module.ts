import { Module } from "@nestjs/common";
import { MessageViewService } from "./message-view.service.js";

@Module({ providers: [MessageViewService], exports: [MessageViewService] })
export class MessageViewModule {}
