import { InventoryMovementType, Prisma } from "../../generated/prisma/client.js";
import type { PrismaClient } from "../../generated/prisma/client.js";

export class InventoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  purchase(vehicleId: string, userId: string, requestKey?: string) {
    return this.withSerializationRetry(() => this.prisma.$transaction(async (tx) => {
      if (requestKey) {
        const duplicate = await tx.purchase.findFirst({ where: { purchasedByUserId: userId, requestKey }, include: { vehicle: true } });
        if (duplicate) {
          if (duplicate.vehicleId !== vehicleId) return { idempotencyConflict: true as const };
          return { purchase: duplicate, repeated: true };
        }
      }
      const updated = await tx.vehicle.updateMany({ where: { id: vehicleId, isActive: true, quantity: { gt: 0 } }, data: { quantity: { decrement: 1 } } });
      if (!updated.count) {
        const existing = await tx.vehicle.findFirst({ where: { id: vehicleId, isActive: true }, select: { id: true } });
        return { unavailable: true as const, missing: !existing };
      }
      const vehicle = await tx.vehicle.findUniqueOrThrow({ where: { id: vehicleId } });
      const purchase = await tx.purchase.create({ data: { purchasedByUserId: userId, vehicleId, unitPriceAtPurchase: vehicle.price, requestKey } });
      await tx.inventoryMovement.create({ data: { vehicleId, actorUserId: userId, purchaseId: purchase.id, type: InventoryMovementType.PURCHASE, quantityDelta: -1, quantityAfter: vehicle.quantity } });
      return { purchase, vehicle, repeated: false };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }));
  }

  restock(vehicleId: string, userId: string, quantity: number, note?: string) {
    return this.withSerializationRetry(() => this.prisma.$transaction(async (tx) => {
      const updated = await tx.vehicle.updateMany({ where: { id: vehicleId, isActive: true }, data: { quantity: { increment: quantity } } });
      if (!updated.count) return null;
      const vehicle = await tx.vehicle.findUniqueOrThrow({ where: { id: vehicleId } });
      await tx.inventoryMovement.create({ data: { vehicleId, actorUserId: userId, type: InventoryMovementType.RESTOCK, quantityDelta: quantity, quantityAfter: vehicle.quantity, note } });
      return vehicle;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }));
  }

  private async withSerializationRetry<T>(operation: () => Promise<T>): Promise<T> {
    for (let attempt = 0; ; attempt += 1) {
      try {
        return await operation();
      } catch (error) {
        if (attempt >= 2 || !isRetryableTransactionError(error)) throw error;
      }
    }
  }
}

function isRetryableTransactionError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error.code === "P2034" || error.code === "P2002");
}
