import { createParamDecorator, Injectable, UnauthorizedException, type CanActivate, type ExecutionContext } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";

type AccessTokenPayload = { sub: string; sid: string };

export type AuthContext = { userId: string; sessionId: string };
export type AuthenticatedRequest = Request & { auth: AuthContext };

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer ")) throw new UnauthorizedException("Sign in to continue.");

    try {
      const payload = await this.jwt.verifyAsync<AccessTokenPayload>(header.slice("Bearer ".length));
      request.auth = { userId: payload.sub, sessionId: payload.sid };
      return true;
    } catch {
      throw new UnauthorizedException("Your session has expired.");
    }
  }
}

export const Auth = createParamDecorator((_data: unknown, context: ExecutionContext): AuthContext => {
  return context.switchToHttp().getRequest<AuthenticatedRequest>().auth;
});
