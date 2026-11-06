/** Remembers who is typing where. A phone that dies mid-sentence never sends "stop", so every entry expires on its own. */
export class TypingTracker {
  private readonly active = new Map<string, { timer: ReturnType<typeof setTimeout>; onExpire: () => void }>();

  constructor(private readonly ttlMs: number) {}

  /** Returns true only when this key was idle, so repeated "start" pings refresh the timer without being relayed again. */
  start(key: string, onExpire: () => void): boolean {
    const wasIdle = !this.stop(key);
    const timer = setTimeout(() => {
      this.active.delete(key);
      onExpire();
    }, this.ttlMs);
    this.active.set(key, { timer, onExpire });
    return wasIdle;
  }

  /** Returns whether the key was active. Does not call `onExpire`. */
  stop(key: string): boolean {
    const entry = this.active.get(key);
    if (!entry) return false;
    clearTimeout(entry.timer);
    this.active.delete(key);
    return true;
  }

  /** Ends every entry whose key starts with `prefix` right now, calling `onExpire` for each. */
  flush(prefix: string): void {
    for (const [key, entry] of this.active) {
      if (!key.startsWith(prefix)) continue;
      clearTimeout(entry.timer);
      this.active.delete(key);
      entry.onExpire();
    }
  }
}
