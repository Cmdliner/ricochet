import { describe, expect, it } from "vitest";
import { looksLikeFile } from "./media-sniff.js";

const bytes = (...values: number[]) => Buffer.from(values);
const text = (value: string) => Buffer.from(value, "latin1");
const mp4 = Buffer.concat([bytes(0, 0, 0, 0x20), text("ftypisom"), bytes(0, 0, 2, 0)]);

describe("looksLikeFile", () => {
  it("rejects the text a failed file read once produced, whatever type it claims", () => {
    const junk = text("File not found");
    for (const type of ["audio/mp4", "video/mp4", "video/quicktime", "audio/webm", "image/jpeg", "image/png", "image/webp", "audio/mpeg"]) {
      expect(looksLikeFile(junk, type), type).toBe(false);
    }
  });

  it("accepts the real container for each type", () => {
    expect(looksLikeFile(mp4, "audio/mp4")).toBe(true);
    expect(looksLikeFile(mp4, "video/mp4")).toBe(true);
    expect(looksLikeFile(mp4, "video/quicktime")).toBe(true);
    expect(looksLikeFile(bytes(0x1a, 0x45, 0xdf, 0xa3, 1, 2), "video/webm")).toBe(true);
    expect(looksLikeFile(text("ID3\u0004rest"), "audio/mpeg")).toBe(true);
    expect(looksLikeFile(bytes(0xff, 0xf1, 0x50), "audio/aac")).toBe(true);
    expect(looksLikeFile(bytes(0xff, 0xd8, 0xff, 0xe0), "image/jpeg")).toBe(true);
    expect(looksLikeFile(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0), "image/png")).toBe(true);
    expect(looksLikeFile(Buffer.concat([text("RIFF"), bytes(1, 2, 3, 4), text("WEBP")]), "image/webp")).toBe(true);
  });

  it("rejects a real file of the wrong kind, an empty file and an unknown type", () => {
    expect(looksLikeFile(bytes(0xff, 0xd8, 0xff, 0xe0), "video/mp4")).toBe(false);
    expect(looksLikeFile(Buffer.alloc(0), "audio/mp4")).toBe(false);
    expect(looksLikeFile(mp4, "application/pdf")).toBe(false);
  });
});
