import { InventoryMovementType, Prisma } from "../../generated/prisma/client.js";
import type { PrismaClient } from "../../generated/prisma/client.js";
import type { CreateVehicleInput, VehicleSearch } from "@dealership/contracts";

export class VehicleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list(filters: VehicleSearch, includeOutOfStock = false) {
    const where: Prisma.VehicleWhereInput = {
      isActive: true,
      ...(includeOutOfStock ? {} : { quantity: { gt: 0 } }),
    };
    if (filters.make) where.make = { contains: filters.make, mode: "insensitive" };
    if (filters.model) where.model = { contains: filters.model, mode: "insensitive" };
    if (filters.category) where.category = { equals: filters.category, mode: "insensitive" };
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) where.price = {
      ...(filters.minPrice !== undefined ? { gte: new Prisma.Decimal(filters.minPrice) } : {}),
      ...(filters.maxPrice !== undefined ? { lte: new Prisma.Decimal(filters.maxPrice) } : {}),
    };
    const skip = (filters.page - 1) * filters.pageSize;
    const [items, total] = await Promise.all([
      this.prisma.vehicle.findMany({ where, skip, take: filters.pageSize, orderBy: [{ make: "asc" }, { model: "asc" }] }),
      this.prisma.vehicle.count({ where }),
    ]);
    return { items, total };
  }

  create(input: CreateVehicleInput, actorUserId: string) {
    return this.prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.create({ data: { ...input, price: new Prisma.Decimal(input.price) } });
      if (vehicle.quantity > 0) {
        await tx.inventoryMovement.create({ data: {
          vehicleId: vehicle.id, actorUserId, type: InventoryMovementType.INITIAL_STOCK,
          quantityDelta: vehicle.quantity, quantityAfter: vehicle.quantity, note: "Opening stock",
        } });
      }
      return vehicle;
    });
  }

  update(id: string, input: CreateVehicleInput, actorUserId: string) {
    return this.withSerializationRetry(() => this.prisma.$transaction(async (tx) => {
      const existing = await tx.vehicle.findFirst({ where: { id, isActive: true } });
      if (!existing) return null;
      const vehicle = await tx.vehicle.update({ where: { id }, data: { ...input, price: new Prisma.Decimal(input.price) } });
      const quantityDelta = vehicle.quantity - existing.quantity;
      if (quantityDelta !== 0) {
        await tx.inventoryMovement.create({ data: {
          vehicleId: id, actorUserId, type: InventoryMovementType.ADJUSTMENT, quantityDelta,
          quantityAfter: vehicle.quantity, note: "Admin inventory adjustment",
        } });
      }
      return vehicle;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }));
  }

  findActive(id: string) { return this.prisma.vehicle.findFirst({ where: { id, isActive: true } }); }
  deactivate(id: string) { return this.prisma.vehicle.updateMany({ where: { id, isActive: true }, data: { isActive: false } }); }

  private async withSerializationRetry<T>(operation: () => Promise<T>): Promise<T> {
    for (let attempt = 0; ; attempt += 1) {
      try { return await operation(); }
      catch (error) {
        if (attempt >= 2 || !isSerializationError(error)) throw error;
      }
    }
  }
}

function isSerializationError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2034";
}
