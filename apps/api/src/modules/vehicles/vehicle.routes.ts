import { Router } from "express";
import { AppDependencies } from "../../app.js";
import { authenticate } from "../../middleware/authenticate.js";
import { requireAdmin } from "../../middleware/authorize.js";
import { VehicleRepository } from "./vehicle.repository.js";
import { VehicleService } from "./vehicle.service.js";
import { ApiError } from "../../shared/api-error.js";
import { createVehicleSchema, updateVehicleSchema, vehicleIdSchema, vehicleSearchSchema } from "@dealership/contracts";

export function createVehicleRoutes(deps: AppDependencies) {
  const routes = Router();
  const service = new VehicleService(new VehicleRepository(deps.prisma));

  routes.get("/options", authenticate(deps), async (req, res) => {
    const result = await service.getOptions();
    res.json({ data: result });
  });

  routes.get("/search", authenticate(deps), async (req, res) => {
    const parsed = vehicleSearchSchema.safeParse(req.query);
    if (!parsed.success) throw new ApiError(422, "VALIDATION_ERROR", "Search parameters are invalid.", { details: parsed.error.flatten() });
    const result = await service.search(req.user.role === "ADMIN", parsed.data);
    res.json({ data: result });
  });

  routes.get("/", authenticate(deps), async (req, res) => {
    const result = await service.list(req.user.role === "ADMIN");
    res.json({ data: result });
  });

  routes.post("/", authenticate(deps), requireAdmin(), async (req, res) => {
    const parsed = createVehicleSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(422, "VALIDATION_ERROR", "Vehicle data is invalid.", { details: parsed.error.flatten() });
    const result = await service.create(req.user.id, parsed.data);
    res.status(201).json({ data: result });
  });

  routes.put("/:id", authenticate(deps), requireAdmin(), async (req, res) => {
    const parsedId = vehicleIdSchema.safeParse(req.params);
    if (!parsedId.success) throw new ApiError(422, "VALIDATION_ERROR", "Vehicle ID is invalid.", { details: parsedId.error.flatten() });
    const parsed = updateVehicleSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(422, "VALIDATION_ERROR", "Vehicle data is invalid.", { details: parsed.error.flatten() });
    const result = await service.update(req.user.id, parsedId.data.id, parsed.data);
    res.json({ data: result });
  });

  routes.delete("/:id", authenticate(deps), requireAdmin(), async (req, res) => {
    const parsedId = vehicleIdSchema.safeParse(req.params);
    if (!parsedId.success) throw new ApiError(422, "VALIDATION_ERROR", "Vehicle ID is invalid.", { details: parsedId.error.flatten() });
    await service.remove(req.user.id, parsedId.data.id);
    res.status(204).send();
  });

  return routes;
}
