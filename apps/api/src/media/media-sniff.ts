const ascii = (head: Buffer, from: number, to: number) => head.subarray(from, to).toString("latin1");

/**
 * Whether the first bytes of a file match what its declared type says. The phone only claims a type, and a failed
 * file read on the phone once uploaded the text "File not found" under the type audio/mp4. This catches that, and
 * anything else that is not what it says, before it becomes a message nobody can play.
 */
export function looksLikeFile(head: Buffer, contentType: string): boolean {
  switch (contentType) {
    case "audio/mp4":
    case "audio/m4a":
    case "audio/x-m4a":
    case "video/mp4":
    case "video/quicktime":
      return ascii(head, 4, 8) === "ftyp";
    case "audio/webm":
    case "video/webm":
      return head.length >= 4 && head.readUInt32BE(0) === 0x1a45dfa3;
    case "audio/mpeg":
      return ascii(head, 0, 3) === "ID3" || (head.length >= 2 && head[0] === 0xff && ((head[1] ?? 0) & 0xe0) === 0xe0);
    case "audio/aac":
      return head.length >= 2 && head[0] === 0xff && ((head[1] ?? 0) & 0xf0) === 0xf0;
    case "image/jpeg":
      return head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
    case "image/png":
      return head.length >= 8 && head.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    case "image/webp":
      return ascii(head, 0, 4) === "RIFF" && ascii(head, 8, 12) === "WEBP";
    default:
      return false;
  }
}

/** How many bytes `looksLikeFile` needs to see. */
export const SNIFF_BYTES = 16;
