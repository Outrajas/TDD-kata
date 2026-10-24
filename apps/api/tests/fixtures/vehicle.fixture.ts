import { randomUUID } from "node:crypto";
import { app } from "../setup.js";

export async function registerAndLogin(emailPrefix = "customer") {
  const email = `${emailPrefix}-${randomUUID()}@example.test`;
  const password = "SecurePass123";
  const registration = await app.request("/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (registration.status !== 201) {
    throw new Error(`Register fixture failed: ${registration.status} ${await registration.text()}`);
  }

  const login = await app.request("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (login.status !== 200) {
    throw new Error(`Login fixture failed: ${login.status} ${await login.text()}`);
  }

  const cookie = login.headers.get("set-cookie")?.split(";")[0];
  if (!cookie) throw new Error("Login fixture did not return the auth cookie.");
  return { email, password, cookie };
}

export async function loginAsAdmin() {
  const credentials = await registerAndLogin("admin");
  const { prisma } = await import("../../src/db.js");
  await prisma.user.update({
    where: { emailNormalized: credentials.email.toLowerCase() },
    data: { role: "ADMIN" },
  });
  const login = await app.request("/api/auth/admin-login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: credentials.email, password: credentials.password }),
  });
  const cookie = login.headers.get("set-cookie")?.split(";")[0];
  if (login.status !== 200 || !cookie) throw new Error("Admin login fixture failed.");
  return { ...credentials, cookie };
}

export async function addVehicle(cookie: string, overrides: Record<string, unknown> = {}) {
  const response = await app.request("/api/vehicles", {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({
      make: "Toyota",
      model: `Corolla-${randomUUID().slice(0, 8)}`,
      category: "Sedan",
      price: 24999.99,
      quantity: 3,
      ...overrides,
    }),
  });
  const body = await response.json();
  if (response.status !== 201) throw new Error(`Vehicle fixture failed: ${JSON.stringify(body)}`);
  return body.data as { id: string; quantity: number; price: string };
}
