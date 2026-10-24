import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../../src/shared/api-error.js";
import { VehicleService, type VehicleRepositoryPort } from "../../src/modules/vehicles/vehicle.service.js";

describe("VehicleService", () => {
  it("returns pagination metadata with the filtered results", async () => {
    const repository = { list: vi.fn(async () => ({ items: [], total: 27 })) } as unknown as VehicleRepositoryPort;
    const service = new VehicleService(repository);

    await expect(service.list({ page: 2, pageSize: 10 })).resolves.toEqual({
      items: [], pagination: { page: 2, pageSize: 10, total: 27, pageCount: 3 },
    });
  });

  it("reports a missing vehicle when soft delete affects no row", async () => {
    const repository = { deactivate: vi.fn(async () => ({ count: 0 })) } as unknown as VehicleRepositoryPort;
    const service = new VehicleService(repository);

    await expect(service.remove("missing-id")).rejects.toMatchObject<ApiError>({ status: 404, code: "VEHICLE_NOT_FOUND" });
  });
});
