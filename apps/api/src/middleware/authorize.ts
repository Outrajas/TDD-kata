import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "./authenticate.js";
import { ApiError } from "../shared/api-error.js";

export function requireAdmin() {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (req.user?.role !== "ADMIN") return next(new ApiError(403, "FORBIDDEN", "Administrator access is required."));
    next();
  };
}
