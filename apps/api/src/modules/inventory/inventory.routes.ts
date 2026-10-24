import { Router } from "express";
import { restockSchema, vehicleIdSchema } from "@dealership/contracts";
import type { AppDependencies } from "../../app.js";
import { authenticate } from "../../middleware/authenticate.js";
import type { AuthenticatedRequest } from "../../middleware/authenticate.js";
import { requireAdmin } from "../../middleware/authorize.js";
import { ApiError } from "../../shared/api-error.js";
import { InventoryRepository } from "./inventory.repository.js";
import { InventoryService } from "./inventory.service.js";

export function createInventoryRoutes(deps: AppDependencies) {
  const routes = Router();
  const service = new InventoryService(new InventoryRepository(deps.prisma));
  routes.post("/:id/purchase", authenticate(deps), async (req: AuthenticatedRequest, res) => {
    const id = vehicleIdSchema.safeParse(req.params.id);
    if (!id.success) throw new ApiError(422, "VALIDATION_ERROR", "Vehicle id is invalid.");
    const key = req.header("Idempotency-Key");
    if (key && (key.length > 128 || !/^[\w.:-]+$/.test(key))) throw new ApiError(422, "VALIDATION_ERROR", "Idempotency-Key is invalid.");
    res.json({ data: await service.purchase(id.data, req.user!.id, key) });
  });
  routes.post("/:id/restock", authenticate(deps), requireAdmin(), async (req: AuthenticatedRequest, res) => {
    const id = vehicleIdSchema.safeParse(req.params.id);
    const parsed = restockSchema.safeParse(req.body);
    if (!id.success || !parsed.success) throw new ApiError(422, "VALIDATION_ERROR", "Restock data is invalid.", { ...(id.success ? {} : { id: id.error.flatten() }), ...(parsed.success ? {} : { body: parsed.error.flatten() }) });
    res.json({ data: await service.restock(id.data, req.user!.id, parsed.data) });
  });
  return routes;
}
