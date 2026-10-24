import { describe, expect, it } from "vitest";
import { app } from "../setup.js";
import { prisma } from "../../src/db.js";
import { addVehicle, loginAsAdmin, registerAndLogin } from "../fixtures/vehicle.fixture.js";

describe("purchase and restock endpoints", () => {
  it("atomically sells the last unit once under concurrent requests", async () => {
    const admin = await loginAsAdmin();
    const customer = await registerAndLogin();
    const vehicle = await addVehicle(admin.cookie, { model: `Last-${Date.now()}`, quantity: 1 });

    const purchase = () => app.request(`/api/vehicles/${vehicle.id}/purchase`, {
      method: "POST", headers: { cookie: customer.cookie },
    });
    const results = await Promise.all([purchase(), purchase()]);
    const statuses = results.map((response) => response.status).sort();
    const current = await prisma.vehicle.findUniqueOrThrow({ where: { id: vehicle.id } });
    const purchaseRows = await prisma.purchase.count({ where: { vehicleId: vehicle.id } });
    const movements = await prisma.inventoryMovement.count({
      where: { vehicleId: vehicle.id, type: "PURCHASE" },
    });

    expect(statuses).toEqual([200, 409]);
    expect(current.quantity).toBe(0);
    expect(purchaseRows).toBe(1);
    expect(movements).toBe(1);
  });

  it("rejects a non-admin restock and records an admin restock", async () => {
    const admin = await loginAsAdmin();
    const customer = await registerAndLogin();
    const vehicle = await addVehicle(admin.cookie, { model: `Restock-${Date.now()}`, quantity: 0 });
    const payload = JSON.stringify({ quantity: 5 });

    const denied = await app.request(`/api/vehicles/${vehicle.id}/restock`, {
      method: "POST", headers: { "content-type": "application/json", cookie: customer.cookie }, body: payload,
    });
    const restocked = await app.request(`/api/vehicles/${vehicle.id}/restock`, {
      method: "POST", headers: { "content-type": "application/json", cookie: admin.cookie }, body: payload,
    });
    const invalid = await app.request(`/api/vehicles/${vehicle.id}/restock`, {
      method: "POST", headers: { "content-type": "application/json", cookie: admin.cookie },
      body: JSON.stringify({ quantity: 0 }),
    });

    expect(denied.status).toBe(403);
    expect(restocked.status).toBe(200);
    expect((await restocked.json()).data.quantity).toBe(5);
    expect(await prisma.inventoryMovement.count({ where: { vehicleId: vehicle.id, type: "RESTOCK", quantityDelta: 5 } })).toBe(1);
    expect(invalid.status).toBe(422);
  });

  it("rejects purchase without a session and reports out-of-stock conflict", async () => {
    const admin = await loginAsAdmin();
    const customer = await registerAndLogin();
    const vehicle = await addVehicle(admin.cookie, { model: `Empty-${Date.now()}`, quantity: 0 });

    const unauthenticated = await app.request(`/api/vehicles/${vehicle.id}/purchase`, { method: "POST" });
    const outOfStock = await app.request(`/api/vehicles/${vehicle.id}/purchase`, {
      method: "POST", headers: { cookie: customer.cookie },
    });

    expect(unauthenticated.status).toBe(401);
    expect(outOfStock.status).toBe(409);
  });

  it("replays an idempotent purchase without decrementing stock twice", async () => {
    const admin = await loginAsAdmin();
    const customer = await registerAndLogin();
    const vehicle = await addVehicle(admin.cookie, { model: `Idempotent-${Date.now()}`, quantity: 2 });
    const purchase = () => app.request(`/api/vehicles/${vehicle.id}/purchase`, {
      method: "POST", headers: { cookie: customer.cookie, "Idempotency-Key": `purchase-${vehicle.id}` },
    });

    const first = await purchase();
    const replay = await purchase();
    const otherVehicle = await addVehicle(admin.cookie, { model: `Other-${Date.now()}`, quantity: 2 });
    const keyConflict = await app.request(`/api/vehicles/${otherVehicle.id}/purchase`, {
      method: "POST", headers: { cookie: customer.cookie, "Idempotency-Key": `purchase-${vehicle.id}` },
    });
    const current = await prisma.vehicle.findUniqueOrThrow({ where: { id: vehicle.id } });
    const purchaseRows = await prisma.purchase.count({ where: { vehicleId: vehicle.id } });

    expect(first.status).toBe(200);
    expect(replay.status).toBe(200);
    expect((await replay.json()).data.repeated).toBe(true);
    expect(keyConflict.status).toBe(409);
    expect(current.quantity).toBe(1);
    expect(purchaseRows).toBe(1);
  });
});
