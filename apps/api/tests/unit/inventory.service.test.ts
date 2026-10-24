import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../../src/shared/api-error.js";
import { InventoryService, type InventoryRepositoryPort } from "../../src/modules/inventory/inventory.service.js";

describe("InventoryService", () => {
  it("translates unavailable stock into a conflict", async () => {
    const repository = { purchase: vi.fn(async () => ({ unavailable: true as const, missing: false })), restock: vi.fn() } as unknown as InventoryRepositoryPort;
    const service = new InventoryService(repository);

    await expect(service.purchase("vehicle-id", "user-id")).rejects.toMatchObject<ApiError>({ status: 409, code: "OUT_OF_STOCK" });
  });

  it("serializes a successful purchase without exposing persistence details", async () => {
    const repository = { purchase: vi.fn(async () => ({ purchase: {
      id: "purchase-id", vehicleId: "vehicle-id", unitPriceAtPurchase: { toString: () => "25000.00" }, purchasedAt: new Date("2026-01-01T00:00:00Z"),
    }, repeated: false })), restock: vi.fn() } as unknown as InventoryRepositoryPort;
    const service = new InventoryService(repository);

    await expect(service.purchase("vehicle-id", "user-id")).resolves.toEqual({
      id: "purchase-id", vehicleId: "vehicle-id", unitPrice: "25000.00", purchasedAt: "2026-01-01T00:00:00.000Z", repeated: false,
    });
  });
});
