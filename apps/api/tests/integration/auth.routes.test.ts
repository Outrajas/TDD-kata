import { describe, expect, it } from "vitest";
import { app } from "../setup.js";
import { prisma } from "../../src/db.js";
import { testJwtSecret } from "../setup.js";
import { randomUUID } from "node:crypto";

describe("authentication endpoints", () => {
  it("exposes a public API health check", async () => {
    const response = await app.request("/api/health");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { status: "ok", database: "connected" } });
  });

  it("registers a normalized customer and never returns the password hash", async () => {
    const email = `  New.User.${randomUUID()}@Example.test `;
    const response = await app.request("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password: "SecurePass123" }),
    });

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.data.user.email).toBe(email.trim().toLowerCase());
    expect(body.data.user.role).toBe("CUSTOMER");
    expect(body.data.user.passwordHash).toBeUndefined();
  });

  it("rejects duplicate email and public role escalation", async () => {
    const email = `duplicate-${randomUUID()}@example.test`;
    const payload = { email, password: "SecurePass123" };
    const first = await app.request("/api/auth/register", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload),
    });
    const duplicate = await app.request("/api/auth/register", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload),
    });
    const escalation = await app.request("/api/auth/register", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...payload, role: "ADMIN" }),
    });

    expect(first.status).toBe(201);
    expect(duplicate.status).toBe(409);
    expect(escalation.status).toBe(422);
  });

  it("issues an HttpOnly JWT cookie and rejects invalid credentials", async () => {
    const email = `login-${randomUUID()}@example.test`;
    await app.request("/api/auth/register", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password: "SecurePass123" }),
    });
    const login = await app.request("/api/auth/login", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password: "SecurePass123" }),
    });
    const invalid = await app.request("/api/auth/login", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password: "wrong-password" }),
    });
    const logout = await app.request("/api/auth/logout", { method: "POST" });

    expect(login.status).toBe(200);
    expect(login.headers.get("set-cookie")).toMatch(/HttpOnly/i);
    expect(login.headers.get("set-cookie")).toMatch(/SameSite=Lax/i);
    const cookie = login.headers.get("set-cookie")!.split(";")[0];
    const session = await app.request("/api/auth/session", { headers: { cookie } });
    expect(invalid.status).toBe(401);
    expect(logout.status).toBe(204);
    expect(session.status).toBe(200);
    expect((await session.json()).data.user.email).toBe(email.toLowerCase());
    expect(logout.headers.get("set-cookie")).toMatch(/Expires=Thu, 01 Jan 1970/i);
    expect(testJwtSecret.length).toBeGreaterThan(31);
    expect(await prisma.user.count({ where: { emailNormalized: email } })).toBe(1);
  });
});
