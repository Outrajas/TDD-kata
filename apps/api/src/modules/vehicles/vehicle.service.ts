import type { CreateVehicleInput, VehicleSearch } from "@dealership/contracts";
import { ApiError } from "../../shared/api-error.js";
import { pagination } from "../../shared/pagination.js";
import { VehicleRepository } from "./vehicle.repository.js";

export type VehicleRepositoryPort = Pick<VehicleRepository, "list" | "create" | "update" | "deactivate">;

export class VehicleService {
  constructor(private readonly repository: VehicleRepositoryPort) {}
  async list(filters: VehicleSearch, includeOutOfStock = false) {
    const result = await this.repository.list(filters, includeOutOfStock);
    return { items: result.items.map(serializeVehicle), pagination: pagination(filters.page, filters.pageSize, result.total) };
  }
  async create(input: CreateVehicleInput, actorUserId: string) { return serializeVehicle(await this.repository.create(input, actorUserId)); }
  async update(id: string, input: CreateVehicleInput, actorUserId: string) {
    const vehicle = await this.repository.update(id, input, actorUserId);
    if (!vehicle) throw new ApiError(404, "VEHICLE_NOT_FOUND", "Vehicle was not found.");
    return serializeVehicle(vehicle);
  }
  async remove(id: string) {
    const result = await this.repository.deactivate(id);
    if (!result.count) throw new ApiError(404, "VEHICLE_NOT_FOUND", "Vehicle was not found.");
  }
}

export function serializeVehicle(vehicle: { id: string; make: string; model: string; category: string; price: { toString: () => string }; quantity: number; createdAt: Date; updatedAt: Date }) {
  return { id: vehicle.id, make: vehicle.make, model: vehicle.model, category: vehicle.category, price: vehicle.price.toString(), quantity: vehicle.quantity, createdAt: vehicle.createdAt.toISOString(), updatedAt: vehicle.updatedAt.toISOString() };
}
