import { describe, expect, it } from "vitest";
import { app } from "../setup.js";
import { prisma } from "../../src/db.js";
import { addVehicle, loginAsAdmin, registerAndLogin } from "../fixtures/vehicle.fixture.js";

describe("vehicle endpoints", () => {
  it("requires authentication for listing and searches by combined filters", async () => {
    const unauthenticated = await app.request("/api/vehicles");
    expect(unauthenticated.status).toBe(401);

    const admin = await loginAsAdmin();
    const vehicle = await addVehicle(admin.cookie, {
      make: "Honda", model: `Civic-${Date.now()}`, category: "Sedan", price: 21000, quantity: 2,
    });
    const response = await app.request("/api/vehicles/search?make=honda&category=sedan&minPrice=20000&maxPrice=22000", {
      headers: { cookie: admin.cookie },
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.items.some((item: { id: string }) => item.id === vehicle.id)).toBe(true);
  });

  it("shows out-of-stock active listings to admins so they can restock them", async () => {
    const admin = await loginAsAdmin();
    const customer = await registerAndLogin();
    const vehicle = await addVehicle(admin.cookie, { quantity: 0 });
    const adminResponse = await app.request("/api/vehicles", { headers: { cookie: admin.cookie } });
    const customerResponse = await app.request("/api/vehicles", { headers: { cookie: customer.cookie } });
    const adminItems = (await adminResponse.json()).data.items as Array<{ id: string; quantity: number }>;
    const customerItems = (await customerResponse.json()).data.items as Array<{ id: string }>;

    expect(adminItems).toContainEqual(expect.objectContaining({ id: vehicle.id, quantity: 0 }));
    expect(customerItems.some((item) => item.id === vehicle.id)).toBe(false);
  });

  it("creates and updates inventory for admins, rejects customers, and soft-deletes", async () => {
    const admin = await loginAsAdmin();
    const customer = await registerAndLogin();
    const created = await addVehicle(admin.cookie, { quantity: 4 });

    const denied = await app.request("/api/vehicles", {
      method: "POST", headers: { "content-type": "application/json", cookie: customer.cookie },
      body: JSON.stringify({ make: "Ford", model: "Focus", category: "Hatchback", price: 18000, quantity: 1 }),
    });
    const updated = await app.request(`/api/vehicles/${created.id}`, {
      method: "PUT", headers: { "content-type": "application/json", cookie: admin.cookie },
      body: JSON.stringify({ make: "Toyota", model: "Updated Corolla", category: "Sedan", price: 25500, quantity: 5 }),
    });
    const deleted = await app.request(`/api/vehicles/${created.id}`, {
      method: "DELETE", headers: { cookie: admin.cookie },
    });

    expect(denied.status).toBe(403);
    expect(updated.status).toBe(200);
    expect((await updated.json()).data.model).toBe("Updated Corolla");
    expect(deleted.status).toBe(204);
    expect(await prisma.inventoryMovement.count({ where: { vehicleId: created.id, type: "INITIAL_STOCK", quantityDelta: 4 } })).toBe(1);
    expect(await prisma.inventoryMovement.count({ where: { vehicleId: created.id, type: "ADJUSTMENT", quantityDelta: 1 } })).toBe(1);
  });

  it("rejects invalid price and quantity values", async () => {
    const admin = await loginAsAdmin();
    const response = await app.request("/api/vehicles", {
      method: "POST", headers: { "content-type": "application/json", cookie: admin.cookie },
      body: JSON.stringify({ make: "Ford", model: "Bad", category: "Sedan", price: 0, quantity: -1 }),
    });
    const invalidPrecision = await app.request("/api/vehicles", {
      method: "POST", headers: { "content-type": "application/json", cookie: admin.cookie },
      body: JSON.stringify({ make: "Ford", model: "BadPrecision", category: "Sedan", price: 10.999, quantity: 1 }),
    });
    expect(response.status).toBe(422);
    expect(invalidPrecision.status).toBe(422);
  });
});
