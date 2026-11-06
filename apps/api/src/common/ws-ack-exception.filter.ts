import { Catch, HttpException, type ArgumentsHost } from "@nestjs/common";
import { WsException, type BaseWsExceptionFilter } from "@nestjs/websockets";

/** Services throw HTTP exceptions (404, 400); over a socket they become `{ ok: false, error }` in the acknowledgement. */
@Catch(WsException, HttpException)
export class WsAckExceptionFilter implements Pick<BaseWsExceptionFilter, "catch"> {
  catch(exception: WsException | HttpException, host: ArgumentsHost) {
    // Nest passes (client, data, ack?, eventName), so find the acknowledgement by type.
    const ack = host.getArgs().find((arg) => typeof arg === "function");
    const error = exception instanceof HttpException ? exception.getResponse() : exception.getError();
    const payload = { ok: false as const, error };

    if (typeof ack === "function") {
      ack(payload);
    } else {
      host.switchToWs().getClient<{ emit: (event: string, data: unknown) => void }>().emit("exception", payload);
    }
  }
}
