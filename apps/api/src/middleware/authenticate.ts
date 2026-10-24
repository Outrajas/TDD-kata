import { jwtVerify } from "jose";
import type { NextFunction, Request, Response } from "express";
import type { AppDependencies } from "../app.js";
import { ApiError } from "../shared/api-error.js";

export type AuthenticatedUser = { id: string; role: "CUSTOMER" | "ADMIN" };
export type AuthenticatedRequest = Request & { user?: AuthenticatedUser };

export function authenticate(deps: AppDependencies) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const token = readCookie(req, "dealership_token");
      if (!token) throw new ApiError(401, "UNAUTHENTICATED", "Authentication is required.");
      const { payload } = await jwtVerify(token, new TextEncoder().encode(deps.jwtSecret));
      if (typeof payload.sub !== "string" || (payload.role !== "CUSTOMER" && payload.role !== "ADMIN")) throw new Error("Invalid claims");
      (req as AuthenticatedRequest).user = { id: payload.sub, role: payload.role };
      next();
    } catch (error) {
      next(error instanceof ApiError ? error : new ApiError(401, "UNAUTHENTICATED", "Session is invalid or expired."));
    }
  };
}

function readCookie(req: Request, name: string) {
  const cookie = req.headers.cookie?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : undefined;
}
