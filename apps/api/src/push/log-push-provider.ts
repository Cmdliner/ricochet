import { Logger } from "@nestjs/common";
import type { PushMessage, PushOutcome, PushProvider } from "./push-provider.js";

/** Writes notifications to the log instead of sending them. For machines that should never reach a real phone. */
export class LogPushProvider implements PushProvider {
  private readonly log = new Logger(LogPushProvider.name);

  send(messages: PushMessage[]): Promise<PushOutcome[]> {
    for (const message of messages) this.log.log(`push to ${message.to}: ${message.title} | ${message.body}`);
    return Promise.resolve(messages.map((message) => ({ to: message.to, status: "ok" as const })));
  }
}
