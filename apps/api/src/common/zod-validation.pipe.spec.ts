import { BadRequestException } from "@nestjs/common";
import { sendMessageSchema } from "@ricochet/shared";
import { describe, expect, it } from "vitest";
import { ZodValidationPipe } from "./zod-validation.pipe.js";

const base = {
  clientId: "0190f5c2-8d5a-7000-8000-000000000001",
  conversationId: "0190f5c2-8d5a-7000-8000-000000000002",
};

describe("ZodValidationPipe with the shared message schema", () => {
  const pipe = new ZodValidationPipe(sendMessageSchema);

  it("accepts a text message", () => {
    expect(pipe.transform({ ...base, type: "text", body: "hello" })).toMatchObject({ body: "hello" });
  });

  it("rejects a text message with no body", () => {
    expect(() => pipe.transform({ ...base, type: "text" })).toThrow(BadRequestException);
  });

  it("rejects a voice note over ten minutes", () => {
    expect(() =>
      pipe.transform({ ...base, type: "voice", mediaKey: "a/b.m4a", durationMs: 11 * 60 * 1000 }),
    ).toThrow(BadRequestException);
  });

  it("rejects a video note over sixty seconds", () => {
    expect(() =>
      pipe.transform({ ...base, type: "video", mediaKey: "a/b.mp4", durationMs: 61 * 1000 }),
    ).toThrow(BadRequestException);
  });

  it("accepts a video note within the limit", () => {
    expect(
      pipe.transform({ ...base, type: "video", mediaKey: "a/b.mp4", durationMs: 8 * 1000 }),
    ).toMatchObject({ type: "video" });
  });
});
