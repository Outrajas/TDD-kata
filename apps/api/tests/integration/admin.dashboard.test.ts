import { describe, expect, it } from "vitest";
import { app } from "../setup.js";
import { loginAsAdmin, registerAndLogin } from "../fixtures/vehicle.fixture.js";

describe("administrator dashboard endpoint", () => {
  it("requires an administrator and returns safe user and inventory summaries", async () => {
    const anonymous = await app.request("/api/admin/dashboard");
    expect(anonymous.status).toBe(401);

    const customer = await registerAndLogin("dashboard-customer");
    const denied = await app.request("/api/admin/dashboard", { headers: { cookie: customer.cookie } });
    expect(denied.status).toBe(403);

    const admin = await loginAsAdmin();
    const response = await app.request("/api/admin/dashboard", { headers: { cookie: admin.cookie } });
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.data.metrics.totalUsers).toBeGreaterThanOrEqual(2);
    expect(body.data.metrics.customers).toBeGreaterThanOrEqual(1);
    expect(body.data.users.some((user: { email: string }) => user.email === customer.email)).toBe(true);
    expect(body.data.users[0]).not.toHaveProperty("passwordHash");
    expect(body.data.generatedAt).toEqual(expect.any(String));
  });
});
