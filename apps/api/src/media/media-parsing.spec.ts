import { describe, expect, it } from "vitest";
import { parseDurationMs } from "../jobs/ffmpeg.js";
import { parseRange } from "./media-storage.js";

describe("parseRange", () => {
  it("reads a closed range, an open end and a suffix", () => {
    expect(parseRange("bytes=0-99", 1000)).toEqual({ start: 0, end: 99 });
    expect(parseRange("bytes=500-", 1000)).toEqual({ start: 500, end: 999 });
    expect(parseRange("bytes=-100", 1000)).toEqual({ start: 900, end: 999 });
  });

  it("clamps an end past the file and returns null for no header", () => {
    expect(parseRange("bytes=900-5000", 1000)).toEqual({ start: 900, end: 999 });
    expect(parseRange(undefined, 1000)).toBeNull();
  });

  it("rejects ranges that cannot be served", () => {
    expect(parseRange("bytes=1000-", 1000)).toBe("invalid");
    expect(parseRange("bytes=50-10", 1000)).toBe("invalid");
    expect(parseRange("bytes=-", 1000)).toBe("invalid");
    expect(parseRange("items=0-1", 1000)).toBe("invalid");
  });
});

describe("parseDurationMs", () => {
  it("turns ffprobe seconds into milliseconds", () => {
    expect(parseDurationMs(JSON.stringify({ format: { duration: "2.345000" } }))).toBe(2345);
  });

  it("refuses output with no usable length", () => {
    expect(() => parseDurationMs(JSON.stringify({ format: {} }))).toThrow();
    expect(() => parseDurationMs(JSON.stringify({ format: { duration: "0" } }))).toThrow();
  });
});
