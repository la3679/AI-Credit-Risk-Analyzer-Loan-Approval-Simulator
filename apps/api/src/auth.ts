import crypto from "node:crypto";
import argon2 from "argon2";
import type { NextFunction, Request, Response } from "express";
import { jwtVerify, SignJWT } from "jose";
import { env } from "./config";
import { Session, User } from "./models";
import { ApiError } from "./errors";
import type { UserRole } from "@credora/shared";

const jwtSecret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
const REFRESH_COOKIE = "credora_refresh";
const ACCESS_COOKIE = "credora_access";
const CSRF_COOKIE = "credora_csrf";

function cookieOptions(httpOnly = true) {
  return { httpOnly, secure: env.COOKIE_SECURE, sameSite: "lax" as const, path: "/" };
}

async function signAccessToken(userId: string, role: UserRole, sessionId: string) {
  return new SignJWT({ role, sid: sessionId })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(env.ACCESS_TOKEN_TTL)
    .sign(jwtSecret);
}

function randomToken(bytes = 32) { return crypto.randomBytes(bytes).toString("base64url"); }

export async function issueSession(res: Response, user: { _id: unknown; role: UserRole }, request?: Request) {
  const rawToken = randomToken();
  const csrfToken = randomToken(24);
  const session = await Session.create({
    ownerId: user._id,
    tokenHash: await argon2.hash(rawToken, { type: argon2.argon2id }),
    csrfToken,
    expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_DAYS * 86_400_000),
    userAgent: request?.get("user-agent"),
    ipHash: request?.ip ? crypto.createHash("sha256").update(request.ip).digest("hex") : undefined,
  });
  const access = await signAccessToken(String(user._id), user.role, String(session._id));
  res.cookie(ACCESS_COOKIE, access, { ...cookieOptions(), maxAge: 15 * 60_000 });
  res.cookie(REFRESH_COOKIE, `${session._id}.${rawToken}`, { ...cookieOptions(), maxAge: env.REFRESH_TOKEN_DAYS * 86_400_000 });
  res.cookie(CSRF_COOKIE, csrfToken, { ...cookieOptions(false), maxAge: env.REFRESH_TOKEN_DAYS * 86_400_000 });
  return session;
}

export async function rotateSession(req: Request, res: Response) {
  const cookie = req.cookies?.[REFRESH_COOKIE] as string | undefined;
  const [sessionId, rawToken] = cookie?.split(".") ?? [];
  if (!sessionId || !rawToken) throw new ApiError(401, "INVALID_REFRESH", "Your session has expired. Please sign in again.");
  const session = await Session.findOne({ _id: sessionId, revokedAt: null, expiresAt: { $gt: new Date() } });
  if (!session || !(await argon2.verify(session.tokenHash, rawToken))) {
    if (session) await Session.updateOne({ _id: session._id }, { revokedAt: new Date() });
    throw new ApiError(401, "INVALID_REFRESH", "Your session has expired. Please sign in again.");
  }
  await Session.updateOne({ _id: session._id }, { revokedAt: new Date() });
  const user = await User.findById(session.ownerId);
  if (!user) throw new ApiError(401, "INVALID_REFRESH", "Your session has expired. Please sign in again.");
  if (user.disabledAt) throw new ApiError(403, "ACCOUNT_DISABLED", "This account has been disabled.");
  return issueSession(res, user, req);
}

export function clearSessionCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE, cookieOptions());
  res.clearCookie(REFRESH_COOKIE, cookieOptions());
  res.clearCookie(CSRF_COOKIE, cookieOptions(false));
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[ACCESS_COOKIE] as string | undefined;
    if (!token) throw new ApiError(401, "UNAUTHENTICATED", "Sign in is required.");
    const { payload } = await jwtVerify(token, jwtSecret);
    if (!payload.sub || !payload.sid || (payload.role !== "user" && payload.role !== "admin" && payload.role !== "guest")) throw new ApiError(401, "UNAUTHENTICATED", "Sign in is required.");
    const [session, user] = await Promise.all([
      Session.exists({ _id: String(payload.sid), ownerId: payload.sub, revokedAt: null, expiresAt: { $gt: new Date() } }),
      User.exists({ _id: payload.sub, disabledAt: null }),
    ]);
    if (!session || !user) throw new ApiError(401, "UNAUTHENTICATED", "Sign in is required.");
    req.auth = { userId: payload.sub, sessionId: String(payload.sid), role: payload.role };
    next();
  } catch (error) { next(error instanceof ApiError ? error : new ApiError(401, "UNAUTHENTICATED", "Sign in is required.")); }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (req.auth?.role !== "admin") return next(new ApiError(403, "FORBIDDEN", "Administrator access is required."));
  next();
}

export function csrfProtection(req: Request, _res: Response, next: NextFunction) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const origin = req.get("origin");
  if (origin && origin !== env.WEB_ORIGIN) return next(new ApiError(403, "CSRF_ORIGIN", "Request origin is not allowed."));
  const hasSession = Boolean(req.cookies?.[ACCESS_COOKIE] || req.cookies?.[REFRESH_COOKIE]);
  if (hasSession && req.path !== "/api/auth/refresh") {
    const token = req.get("x-csrf-token");
    if (!token || token !== req.cookies?.[CSRF_COOKIE]) return next(new ApiError(403, "CSRF_TOKEN", "A valid CSRF token is required."));
  }
  next();
}
