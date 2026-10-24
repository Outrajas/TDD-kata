import type { ErrorRequestHandler, RequestHandler } from "express";
import { ApiError } from "../shared/api-error.js";

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found." } });
};

export const apiErrorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  void _next;
  if (error instanceof ApiError) {
    res.status(error.status).json({ error: { code: error.code, message: error.message, ...(error.details ? { details: error.details } : {}) } });
    return;
  }
  if (isBodyParserError(error)) {
    const tooLarge = "status" in error && error.status === 413;
    res.status(tooLarge ? 413 : 400).json({ error: { code: tooLarge ? "PAYLOAD_TOO_LARGE" : "INVALID_JSON", message: tooLarge ? "Request body exceeds the 32 KB limit." : "Request body must contain valid JSON." } });
    return;
  }
  console.error(error);
  res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." } });
};

function isBodyParserError(error: unknown): error is { type: string; status?: number } {
  return typeof error === "object" && error !== null && "type" in error && (error.type === "entity.parse.failed" || error.type === "entity.too.large");
}
