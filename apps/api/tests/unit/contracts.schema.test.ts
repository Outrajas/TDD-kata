import { describe, expect, it } from "vitest";
import { createVehicleSchema, registerSchema, restockSchema, vehicleSearchSchema } from "@dealership/contracts";

describe("shared request schemas", () => {
  it("normalizes registration email and rejects client-selected roles", () => {
    expect(registerSchema.parse({ email: " User@Example.test ", password: "SecurePass123" }).email).toBe("User@Example.test");
    expect(registerSchema.safeParse({ email: "user@example.test", password: "SecurePass123", role: "ADMIN" }).success).toBe(false);
  });

  it("allows zero stock, requires positive prices, and rejects more than two price decimals", () => {
    const base = { make: "Toyota", model: "Corolla", category: "Sedan", quantity: 0 };
    expect(createVehicleSchema.safeParse({ ...base, price: 20_000.5 }).success).toBe(true);
    expect(createVehicleSchema.safeParse({ ...base, price: 20_000.555 }).success).toBe(false);
    expect(createVehicleSchema.safeParse({ ...base, price: 0 }).success).toBe(false);
  });

  it("requires positive integer restocks and valid inclusive price ranges", () => {
    expect(restockSchema.safeParse({ quantity: 1 }).success).toBe(true);
    expect(restockSchema.safeParse({ quantity: 1.5 }).success).toBe(false);
    expect(vehicleSearchSchema.safeParse({ minPrice: "25000", maxPrice: "20000" }).success).toBe(false);
  });
});
