import type { RestockInput } from "@dealership/contracts";
import { ApiError } from "../../shared/api-error.js";
import { serializeVehicle } from "../vehicles/vehicle.service.js";
import { InventoryRepository } from "./inventory.repository.js";

export type InventoryRepositoryPort = Pick<InventoryRepository, "purchase" | "restock">;

export class InventoryService {
  constructor(private readonly repository: InventoryRepositoryPort) {}
  async purchase(vehicleId: string, userId: string, requestKey?: string) {
    const result = await this.repository.purchase(vehicleId, userId, requestKey);
    if ("idempotencyConflict" in result) throw new ApiError(409, "IDEMPOTENCY_KEY_REUSED", "Idempotency-Key was already used for another vehicle.");
    if ("unavailable" in result) {
      if (result.missing) throw new ApiError(404, "VEHICLE_NOT_FOUND", "Vehicle was not found.");
      throw new ApiError(409, "OUT_OF_STOCK", "Vehicle is out of stock.");
    }
    return { id: result.purchase.id, vehicleId: result.purchase.vehicleId, unitPrice: result.purchase.unitPriceAtPurchase.toString(), purchasedAt: result.purchase.purchasedAt.toISOString(), repeated: result.repeated };
  }
  async restock(vehicleId: string, userId: string, input: RestockInput) {
    try {
      const vehicle = await this.repository.restock(vehicleId, userId, input.quantity, input.note);
      if (!vehicle) throw new ApiError(404, "VEHICLE_NOT_FOUND", "Vehicle was not found.");
      return serializeVehicle(vehicle);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") throw new ApiError(404, "VEHICLE_NOT_FOUND", "Vehicle was not found.");
      if (typeof error === "object" && error !== null && "code" in error && error.code === "P2020") throw new ApiError(422, "STOCK_LIMIT_EXCEEDED", "Restock would exceed the supported inventory limit.");
      throw error;
    }
  }
}
