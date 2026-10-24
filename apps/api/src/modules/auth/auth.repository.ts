import type { PrismaClient } from "../../generated/prisma/client.js";

export class AuthRepository {
  constructor(private readonly prisma: PrismaClient) {}
  findByNormalizedEmail(emailNormalized: string) {
    return this.prisma.user.findUnique({ where: { emailNormalized } });
  }
  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }
  createCustomer(emailNormalized: string, passwordHash: string) {
    return this.prisma.user.create({ data: { email: emailNormalized, emailNormalized, passwordHash } });
  }
}
