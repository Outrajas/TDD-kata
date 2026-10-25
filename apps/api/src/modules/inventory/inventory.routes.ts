import { Router } from "express";
import { AppDependencies } from "../../app.js";
import { authenticate } from "../../middleware/authenticate.js";
import { requireAdmin } from "../../middleware/authorize.js";
import { InventoryRepository } from "./inventory.repository.js";
import { InventoryService } from "./inventory.service.js";
import { ApiError } from "../../shared/api-error.js";
import { vehicleIdSchema, restockSchema } from "@dealership/contracts";
import type { AuthenticatedRequest } from "../../middleware/authenticate.js";

export function createInventoryRoutes(deps: AppDependencies) {
  const routes = Router();
  const service = new InventoryService(new InventoryRepository(deps.prisma));

  routes.post("/:id/purchase", authenticate(deps), async (req: AuthenticatedRequest, res) => {
    const parsedId = vehicleIdSchema.safeParse(req.params);
    if (!parsedId.success) throw new ApiError(422, "VALIDATION_ERROR", "Vehicle ID is invalid.", { details: parsedId.error.flatten() });
    
    const idempotencyKey = req.header("Idempotency-Key") || undefined;
    const result = await service.purchase(req.user.id, parsedId.data.id, idempotencyKey);
    res.json({ data: result });
  });

  routes.post("/:id/restock", authenticate(deps), requireAdmin(), async (req: AuthenticatedRequest, res) => {
    const parsedId = vehicleIdSchema.safeParse(req.params);
    if (!parsedId.success) throw new ApiError(422, "VALIDATION_ERROR", "Vehicle ID is invalid.", { details: parsedId.error.flatten() });
    
    const parsedBody = restockSchema.safeParse(req.body);
    if (!parsedBody.success) throw new ApiError(422, "VALIDATION_ERROR", "Restock data is invalid.", { details: parsedBody.error.flatten() });
    
    await service.restock(parsedId.data.id, req.user.id, parsedBody.data.quantity, parsedBody.data.note);
    res.status(200).json({ data: { message: "Restocked successfully" } });
  });

  return routes;
}
