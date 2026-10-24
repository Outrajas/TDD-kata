import type { RequestHandler } from "express";

export function createCorsMiddleware(origin: string): RequestHandler {
  return (req, res, next) => {
    const requestOrigin = req.header("origin");
    if (requestOrigin === origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Vary", "Origin");
    }
    if (req.method === "OPTIONS") {
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type,Idempotency-Key");
      res.sendStatus(204);
      return;
    }
    next();
  };
}
