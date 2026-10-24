import express, { type Express } from "express";
import type { PrismaClient } from "./generated/prisma/client.js";
import { createCorsMiddleware } from "./config/cors.js";
import { apiErrorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { createAuthRoutes } from "./modules/auth/auth.routes.js";
import { createVehicleRoutes } from "./modules/vehicles/vehicle.routes.js";
import { createInventoryRoutes } from "./modules/inventory/inventory.routes.js";
import { createAdminRoutes } from "./modules/admin/admin.routes.js";

export type AppDependencies = { prisma: PrismaClient; jwtSecret: string; allowedOrigin?: string; secureCookies?: boolean };
export function createApp(deps: AppDependencies): Express {
  if (deps.jwtSecret.length < 32) throw new Error("JWT secret must contain at least 32 characters.");
  const app = express();
  app.disable("x-powered-by");
  app.use(createCorsMiddleware(deps.allowedOrigin ?? "http://localhost:3000"));
  app.use(express.json({ limit: "32kb" }));
  app.get("/api/health", async (_req, res) => {
    try {
      await deps.prisma.$queryRaw`SELECT 1`;
      res.json({ data: { status: "ok", database: "connected" } });
    } catch {
      res.status(503).json({ error: { code: "DATABASE_UNAVAILABLE", message: "The API is running but PostgreSQL is unavailable." } });
    }
  });
  app.use("/api/auth", createAuthRoutes(deps));
  app.use("/api/admin", createAdminRoutes(deps));
  app.use("/api/vehicles", createVehicleRoutes(deps));
  app.use("/api/vehicles", createInventoryRoutes(deps));
  app.use(notFoundHandler);
  app.use(apiErrorHandler);
  return app;
}
