import { describe, expect, it, vi } from "vitest";
import { AuthService, type AuthRepositoryPort } from "../../src/modules/auth/auth.service.js";

describe("AuthService", () => {
  it("normalizes registration email and returns a customer without credential fields", async () => {
    const createCustomer = vi.fn(async (emailNormalized: string) => ({
      id: "user-id", email: emailNormalized, role: "CUSTOMER", createdAt: new Date("2026-01-01T00:00:00Z"),
    }));
    const repository = { findByNormalizedEmail: vi.fn(async () => null), createCustomer } as unknown as AuthRepositoryPort;
    const service = new AuthService(repository, "a sufficiently long test-only JWT secret");

    const result = await service.register({ email: " User@Example.test ", password: "SecurePass123" });

    expect(createCustomer).toHaveBeenCalledWith("user@example.test", expect.any(String));
    expect(result).toEqual({ id: "user-id", email: "user@example.test", role: "CUSTOMER", createdAt: "2026-01-01T00:00:00.000Z" });
    expect(result).not.toHaveProperty("passwordHash");
  });
});
