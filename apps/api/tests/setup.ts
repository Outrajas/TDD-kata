import "dotenv/config";
import { afterAll, beforeAll } from "vitest";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { prisma } from "../src/db.js";
import { createApp } from "../src/app.js";

export const testJwtSecret = "unit-test-only-secret-with-at-least-32-characters";
const serverApp = createApp({ prisma, jwtSecret: testJwtSecret });
let server: ReturnType<typeof serverApp.listen>;
let baseUrl = "";

export const app = {
  request: (path: string, init?: RequestInit) => fetch(new URL(path, baseUrl), init),
};

beforeAll(async () => {
  server = serverApp.listen(0, "127.0.0.1");
  await once(server, "listening");
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  if (server) await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  await prisma.$disconnect();
});
