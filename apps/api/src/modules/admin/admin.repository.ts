import type { PrismaClient } from "../../generated/prisma/client.js";

export class AdminRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async dashboard() {
    const [users, totalUsers, customers, admins, activeVehicles, stock, purchases] = await Promise.all([
      this.prisma.user.findMany({ select: { id: true, email: true, role: true, isActive: true, createdAt: true }, orderBy: [{ createdAt: "desc" }, { email: "asc" }] }),
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: "CUSTOMER" } }),
      this.prisma.user.count({ where: { role: "ADMIN" } }),
      this.prisma.vehicle.count({ where: { isActive: true } }),
      this.prisma.vehicle.aggregate({ where: { isActive: true }, _sum: { quantity: true } }),
      this.prisma.purchase.count(),
    ]);
    return {
      metrics: { totalUsers, customers, admins, activeVehicles, availableUnits: stock._sum.quantity ?? 0, purchases },
      users: users.map((user) => ({ ...user, createdAt: user.createdAt.toISOString() })),
      generatedAt: new Date().toISOString(),
    };
  }
}
