import { Router } from "express";
import type { AppDependencies } from "../../app.js";
import { authenticate } from "../../middleware/authenticate.js";
import { requireAdmin } from "../../middleware/authorize.js";
import { AdminRepository } from "./admin.repository.js";
import { AdminService } from "./admin.service.js";

export function createAdminRoutes(deps: AppDependencies) {
  const routes = Router();
  const service = new AdminService(new AdminRepository(deps.prisma));
  routes.get("/dashboard", authenticate(deps), requireAdmin(), async (_req, res) => {
    res.json({ data: await service.getDashboard() });
  });
  return routes;
}
