import { Router } from "express";
import { createVehicleSchema, updateVehicleSchema, vehicleIdSchema, vehicleSearchSchema } from "@dealership/contracts";
import type { AppDependencies } from "../../app.js";
import { authenticate } from "../../middleware/authenticate.js";
import type { AuthenticatedRequest } from "../../middleware/authenticate.js";
import { requireAdmin } from "../../middleware/authorize.js";
import { ApiError } from "../../shared/api-error.js";
import { VehicleRepository } from "./vehicle.repository.js";
import { VehicleService } from "./vehicle.service.js";

export function createVehicleRoutes(deps: AppDependencies) {
  const routes = Router();
  const service = new VehicleService(new VehicleRepository(deps.prisma));
  routes.get("/search", authenticate(deps), async (req: AuthenticatedRequest, res) => {
    const parsed = vehicleSearchSchema.safeParse(req.query);
    if (!parsed.success) throw new ApiError(422, "VALIDATION_ERROR", "Search filters are invalid.", parsed.error.flatten());
    res.json({ data: await service.list(parsed.data, req.user!.role === "ADMIN") });
  });
  routes.get("/", authenticate(deps), async (req: AuthenticatedRequest, res) => {
    const parsed = vehicleSearchSchema.safeParse(req.query);
    if (!parsed.success) throw new ApiError(422, "VALIDATION_ERROR", "Pagination and filters are invalid.", parsed.error.flatten());
    res.json({ data: await service.list(parsed.data, req.user!.role === "ADMIN") });
  });
  routes.post("/", authenticate(deps), requireAdmin(), async (req: AuthenticatedRequest, res) => {
    const parsed = createVehicleSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(422, "VALIDATION_ERROR", "Vehicle data is invalid.", parsed.error.flatten());
    res.status(201).json({ data: await service.create(parsed.data, req.user!.id) });
  });
  routes.put("/:id", authenticate(deps), requireAdmin(), async (req: AuthenticatedRequest, res) => {
    const id = vehicleIdSchema.safeParse(req.params.id);
    const parsed = updateVehicleSchema.safeParse(req.body);
    if (!id.success || !parsed.success) throw new ApiError(422, "VALIDATION_ERROR", "Vehicle update data is invalid.", { ...(id.success ? {} : { id: id.error.flatten() }), ...(parsed.success ? {} : { body: parsed.error.flatten() }) });
    res.json({ data: await service.update(id.data, parsed.data, req.user!.id) });
  });
  routes.delete("/:id", authenticate(deps), requireAdmin(), async (req, res) => {
    const id = vehicleIdSchema.safeParse(req.params.id);
    if (!id.success) throw new ApiError(422, "VALIDATION_ERROR", "Vehicle id is invalid.");
    await service.remove(id.data);
    res.status(204).end();
  });
  return routes;
}
