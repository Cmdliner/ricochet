import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);
const TIMEOUT_MS = 60_000;

export class MissingBinaryError extends Error {}

async function exec(binary: string, args: string[]): Promise<string> {
  try {
    const { stdout } = await run(binary, args, { timeout: TIMEOUT_MS, maxBuffer: 10_000_000 });
    return stdout;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") throw new MissingBinaryError(`${binary} is not installed.`);
    throw error;
  }
}

/** The real length of a media file in milliseconds. The phone's claim is only a claim. */
export async function probeDurationMs(ffprobe: string, file: string): Promise<number> {
  const output = await exec(ffprobe, ["-v", "error", "-print_format", "json", "-show_format", file]);
  return parseDurationMs(output);
}

export function parseDurationMs(ffprobeJson: string): number {
  const seconds = Number((JSON.parse(ffprobeJson) as { format?: { duration?: string } }).format?.duration);
  if (!Number.isFinite(seconds) || seconds <= 0) throw new Error("Could not read the length of this file.");
  return Math.round(seconds * 1000);
}

/** One frame near the start, scaled down, as a JPEG. */
export async function makePoster(ffmpeg: string, input: string, output: string, atSeconds: number): Promise<void> {
  await exec(ffmpeg, ["-y", "-ss", String(atSeconds), "-i", input, "-frames:v", "1", "-vf", "scale=480:-2", "-q:v", "4", output]);
}
