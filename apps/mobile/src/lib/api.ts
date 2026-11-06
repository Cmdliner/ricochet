import { apiErrorSchema } from "@ricochet/shared";
import type { z } from "zod";
import { API_URL } from "./config";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Lets the auth store plug in without the two files importing each other. */
type AuthHandlers = {
  getAccessToken: () => string | null;
  refresh: () => Promise<string | null>;
};
let handlers: AuthHandlers | null = null;
export function configureApi(next: AuthHandlers) {
  handlers = next;
}

type ApiOptions<S extends z.ZodType> = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /** Send the access token, and refresh it once if the server says it has expired. */
  auth?: boolean;
  schema?: S;
};

/** Without a limit, an unreachable server can leave a request hanging for minutes. */
const REQUEST_TIMEOUT_MS = 12_000;

async function send(path: string, method: string, body: unknown, token: string | null) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (token) headers.authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    throw new ApiError(0, "Could not reach Ricochet. Check your connection and try again.");
  } finally {
    clearTimeout(timer);
  }
}

async function errorFrom(res: Response): Promise<ApiError> {
  const parsed = apiErrorSchema.safeParse(await res.json().catch(() => null));
  const body = parsed.success ? parsed.data : {};
  const message =
    body.issues?.[0]?.message ??
    (Array.isArray(body.message) ? body.message[0] : body.message) ??
    "Something went wrong. Please try again.";
  return new ApiError(res.status, message);
}

export async function api<S extends z.ZodType = z.ZodUnknown>(
  path: string,
  { method = "GET", body, auth = false, schema }: ApiOptions<S> = {},
): Promise<z.output<S>> {
  let res = await send(path, method, body, auth ? (handlers?.getAccessToken() ?? null) : null);

  if (auth && res.status === 401 && handlers) {
    const token = await handlers.refresh();
    if (token) res = await send(path, method, body, token);
  }

  if (!res.ok) throw await errorFrom(res);
  if (!schema || res.status === 204) return undefined as z.output<S>;
  return schema.parse(await res.json());
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}
