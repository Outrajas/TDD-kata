import { Router } from "express";
import { loginSchema, registerSchema } from "@dealership/contracts";
import type { AppDependencies } from "../../app.js";
import { AuthService } from "./auth.service.js";
import { AuthRepository } from "./auth.repository.js";
import { ApiError } from "../../shared/api-error.js";

export function createAuthRoutes(deps: AppDependencies) {
  const routes = Router();
  const service = new AuthService(new AuthRepository(deps.prisma), deps.jwtSecret);
  routes.post("/register", async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(422, "VALIDATION_ERROR", "Registration data is invalid.", parsed.error.flatten());
    res.status(201).json({ data: { user: await service.register(parsed.data) } });
  });
  routes.post("/login", async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(422, "VALIDATION_ERROR", "Login data is invalid.", parsed.error.flatten());
    const result = await service.login(parsed.data);
    res.cookie("dealership_token", result.token, { httpOnly: true, sameSite: "lax", secure: deps.secureCookies ?? process.env.NODE_ENV === "production", path: "/", maxAge: 900_000 });
    res.json({ data: { user: result.user } });
  });
  routes.post("/logout", (_req, res) => {
    res.clearCookie("dealership_token", { httpOnly: true, sameSite: "lax", secure: deps.secureCookies ?? process.env.NODE_ENV === "production", path: "/" });
    res.status(204).end();
  });
  return routes;
}
