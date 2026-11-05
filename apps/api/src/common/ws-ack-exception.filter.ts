import { Catch, type ArgumentsHost } from "@nestjs/common";
import { WsException, type BaseWsExceptionFilter } from "@nestjs/websockets";

/**
 * Sends socket errors back through the acknowledgement, so the phone gets
 * `{ ok: false, error }` for the exact event it sent instead of waiting for a timeout.
 */
@Catch(WsException)
export class WsAckExceptionFilter implements Pick<BaseWsExceptionFilter, "catch"> {
  catch(exception: WsException, host: ArgumentsHost) {
    // Nest passes (client, data, ack?, eventName), so find the acknowledgement by type.
    const ack = host.getArgs().find((arg) => typeof arg === "function");
    const payload = { ok: false as const, error: exception.getError() };

    if (typeof ack === "function") {
      ack(payload);
    } else {
      host.switchToWs().getClient<{ emit: (event: string, data: unknown) => void }>().emit("exception", payload);
    }
  }
}
