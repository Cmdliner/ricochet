import { Logger } from "@nestjs/common";
import type { PushMessage, PushOutcome, PushProvider } from "./push-provider.js";

/** Expo accepts at most this many notifications per request. */
const BATCH_SIZE = 100;

type Ticket = { status: "ok" } | { status: "error"; message?: string; details?: { error?: string } };

export class ExpoPushProvider implements PushProvider {
  private readonly log = new Logger(ExpoPushProvider.name);

  constructor(
    private readonly url: string,
    private readonly accessToken?: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async send(messages: PushMessage[]): Promise<PushOutcome[]> {
    const outcomes: PushOutcome[] = [];
    for (let start = 0; start < messages.length; start += BATCH_SIZE) {
      outcomes.push(...(await this.sendBatch(messages.slice(start, start + BATCH_SIZE))));
    }
    return outcomes;
  }

  private async sendBatch(batch: PushMessage[]): Promise<PushOutcome[]> {
    try {
      const response = await this.fetchImpl(this.url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
          ...(this.accessToken && { authorization: `Bearer ${this.accessToken}` }),
        },
        body: JSON.stringify(batch.map((message) => ({ ...message, sound: "default", priority: "high", channelId: "default" }))),
      });
      if (!response.ok) throw new Error(`Expo answered ${response.status}`);
      const { data } = (await response.json()) as { data: Ticket[] };
      return batch.map((message, index) => outcomeOf(message.to, data[index]));
    } catch (error) {
      this.log.error(`Could not reach Expo's push service: ${String(error)}`);
      return batch.map((message) => ({ to: message.to, status: "failed" as const }));
    }
  }
}

export function outcomeOf(to: string, ticket: Ticket | undefined): PushOutcome {
  if (ticket?.status === "ok") return { to, status: "ok" };
  if (ticket?.status === "error" && ticket.details?.error === "DeviceNotRegistered") return { to, status: "invalid-token" };
  return { to, status: "failed" };
}
