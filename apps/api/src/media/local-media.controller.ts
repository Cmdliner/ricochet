import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  PayloadTooLargeException,
  Put,
  Query,
  Req,
  Res,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request, Response } from "express";
import { createReadStream, createWriteStream } from "node:fs";
import { rm } from "node:fs/promises";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { Env } from "../config/env.js";
import { LocalMediaStorage } from "./local-media-storage.js";
import { verify } from "./media-signature.js";
import { isSafeKey, MEDIA_STORAGE, PUBLIC_PREFIX, type MediaStorage } from "./media-storage.js";

/** The upload and download endpoints for the local provider. With R2 these paths do not exist, because the phone talks to Cloudflare directly. */
@Controller("media/local")
export class LocalMediaController {
  constructor(
    @Inject(MEDIA_STORAGE) private readonly storage: MediaStorage,
    private readonly config: ConfigService<Env, true>,
  ) {}

  private local(): LocalMediaStorage {
    if (!(this.storage instanceof LocalMediaStorage)) throw new NotFoundException();
    return this.storage;
  }

  private get secret() {
    return this.config.get("JWT_SECRET", { infer: true });
  }

  @Put("upload")
  @HttpCode(HttpStatus.NO_CONTENT)
  async upload(@Query() query: Record<string, string | undefined>, @Req() request: Request): Promise<void> {
    const storage = this.local();
    const key = query.key ?? "";
    const contentType = query.ct ?? "";
    const maxBytes = Number(query.max);
    const exp = Number(query.exp);
    if (!verify({ action: "upload", key, exp, contentType, maxBytes }, query.sig ?? "", this.secret)) {
      throw new ForbiddenException("This upload link is not valid or has expired.");
    }
    if (request.headers["content-type"] !== contentType) {
      throw new BadRequestException("The file type does not match the upload link.");
    }
    if (Number(request.headers["content-length"] ?? 0) > maxBytes) throw new PayloadTooLargeException();

    const path = await storage.prepare(key);
    let received = 0;
    const limit = new Transform({
      transform(chunk: Buffer, _encoding, done) {
        received += chunk.length;
        done(received > maxBytes ? new PayloadTooLargeException() : null, chunk);
      },
    });
    try {
      await pipeline(request, limit, createWriteStream(path));
    } catch (error) {
      await rm(path, { force: true });
      throw error;
    }
    await storage.saveMeta(key, contentType);
  }

  @Get("files/*key")
  async file(
    @Param("key") rawKey: string | string[],
    @Query() query: Record<string, string | undefined>,
    @Res() response: Response,
  ): Promise<void> {
    const storage = this.local();
    const key = Array.isArray(rawKey) ? rawKey.join("/") : rawKey;
    if (!isSafeKey(key)) throw new NotFoundException();

    const isPublic = key.startsWith(PUBLIC_PREFIX);
    if (!isPublic && !verify({ action: "download", key, exp: Number(query.exp) }, query.sig ?? "", this.secret)) {
      throw new ForbiddenException("This link is not valid or has expired.");
    }
    const object = await storage.stat(key);
    if (!object) throw new NotFoundException();

    response.setHeader("content-type", object.contentType ?? "application/octet-stream");
    response.setHeader("content-length", String(object.size));
    response.setHeader("cache-control", isPublic ? "public, max-age=31536000, immutable" : "private, no-store");
    createReadStream(storage.pathFor(key)).pipe(response);
  }
}
