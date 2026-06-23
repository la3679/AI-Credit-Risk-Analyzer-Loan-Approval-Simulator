import type { RequestHandler } from "express";
import type { UserRole } from "@credora/shared";

declare global {
  namespace Express {
    interface Request {
      auth?: { userId: string; role: UserRole; sessionId: string };
      requestId: string;
    }
  }
}

export type AuthenticatedHandler = RequestHandler;
