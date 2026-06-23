import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown[]) {
    super(message);
  }
}

export const notFound: RequestHandler = (req, _res, next) => next(new ApiError(404, "NOT_FOUND", `Route ${req.method} ${req.path} was not found.`));

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const normalized = error instanceof ZodError
    ? new ApiError(400, "VALIDATION_ERROR", "Request validation failed.", error.issues)
    : error instanceof ApiError
      ? error
      : new ApiError(500, "INTERNAL_ERROR", "An unexpected error occurred.");
  req.log?.error({ err: error, code: normalized.code, requestId: req.requestId }, "API request failed");
  res.status(normalized.status).json({ error: { code: normalized.code, message: normalized.message, requestId: req.requestId, ...(normalized.details ? { details: normalized.details } : {}) } });
};
