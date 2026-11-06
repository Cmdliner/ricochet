import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TypingTracker } from "./typing-tracker.js";

describe("TypingTracker", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("expires on its own when no stop arrives", () => {
    const tracker = new TypingTracker(5000);
    const expired = vi.fn();
    tracker.start("a:1", expired);
    vi.advanceTimersByTime(4999);
    expect(expired).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(expired).toHaveBeenCalledTimes(1);
  });

  it("reports a start as new only when the key was idle, and a repeat pushes the expiry back", () => {
    const tracker = new TypingTracker(5000);
    const expired = vi.fn();
    expect(tracker.start("a:1", expired)).toBe(true);
    vi.advanceTimersByTime(3000);
    expect(tracker.start("a:1", expired)).toBe(false);
    vi.advanceTimersByTime(3000);
    expect(expired).not.toHaveBeenCalled();
    vi.advanceTimersByTime(2000);
    expect(expired).toHaveBeenCalledTimes(1);
  });

  it("stop cancels the timer and says whether anything was active", () => {
    const tracker = new TypingTracker(5000);
    const expired = vi.fn();
    tracker.start("a:1", expired);
    expect(tracker.stop("a:1")).toBe(true);
    expect(tracker.stop("a:1")).toBe(false);
    vi.advanceTimersByTime(10_000);
    expect(expired).not.toHaveBeenCalled();
  });

  it("flush ends only the entries under the prefix, immediately", () => {
    const tracker = new TypingTracker(5000);
    const mine = vi.fn();
    const theirs = vi.fn();
    tracker.start("a:1", mine);
    tracker.start("a:2", mine);
    tracker.start("b:1", theirs);
    tracker.flush("a:");
    expect(mine).toHaveBeenCalledTimes(2);
    expect(theirs).not.toHaveBeenCalled();
    vi.advanceTimersByTime(5000);
    expect(mine).toHaveBeenCalledTimes(2);
    expect(theirs).toHaveBeenCalledTimes(1);
  });
});
