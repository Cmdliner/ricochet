import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { MEDIA_STORAGE, type MediaStorage, type UploadTarget } from "./media-storage.js";

/** What a kind of upload may be: the types accepted (with the file extension each gets) and how large it can be. */
export type UploadRule = { types: Record<string, string>; maxBytes: number };

const UPLOAD_LINK_SECONDS = 10 * 60;

@Injectable()
export class MediaService {
  constructor(@Inject(MEDIA_STORAGE) private readonly storage: MediaStorage) {}

  /** Checks the request against the rule and returns where the phone should upload to. `prefix` decides who can later claim the key. */
  async requestUpload(
    rule: UploadRule,
    prefix: string,
    input: { contentType: string; size: number; id: string },
  ): Promise<{ key: string; upload: UploadTarget }> {
    const extension = rule.types[input.contentType];
    if (!extension) throw new BadRequestException("That file type is not supported.");
    if (input.size > rule.maxBytes) {
      throw new BadRequestException(`That file is too large. The limit is ${Math.round(rule.maxBytes / 1_000_000)} MB.`);
    }

    const key = `${prefix}${input.id}.${extension}`;
    const upload = await this.storage.createUpload({
      key,
      contentType: input.contentType,
      maxBytes: rule.maxBytes,
      expiresInSeconds: UPLOAD_LINK_SECONDS,
    });
    return { key, upload };
  }

  /** The phone uploads straight to storage, so before trusting a key this looks at what is really there. */
  async verifyUpload(key: string, rule: UploadRule): Promise<void> {
    const stored = await this.storage.stat(key);
    if (!stored) throw new BadRequestException("The upload did not arrive. Try again.");
    const typeOk = stored.contentType !== null && stored.contentType in rule.types;
    if (!typeOk || stored.size > rule.maxBytes || stored.size === 0) {
      await this.storage.delete(key).catch(() => undefined);
      throw new BadRequestException("That file was rejected. Check the type and size and try again.");
    }
  }

  publicUrl(key: string | null): string | null {
    return key ? this.storage.publicUrl(key) : null;
  }

  downloadUrl(key: string, expiresInSeconds = 60 * 60): Promise<string> {
    return this.storage.createDownloadUrl(key, expiresInSeconds);
  }

  download(key: string, destination: string): Promise<void> {
    return this.storage.download(key, destination);
  }

  uploadFile(key: string, source: string, contentType: string): Promise<void> {
    return this.storage.uploadFile(key, source, contentType);
  }

  async remove(key: string | null): Promise<void> {
    if (key) await this.storage.delete(key).catch(() => undefined);
  }
}
