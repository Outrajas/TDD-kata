import "dotenv/config";
import { createApp } from "./app.js";
import { prisma } from "./db.js";
import { loadEnvironment } from "./config/env.js";

const environment = loadEnvironment();

const app = createApp({ prisma, jwtSecret: environment.JWT_SECRET, allowedOrigin: environment.WEB_ORIGIN, secureCookies: environment.NODE_ENV === "production" });
const server = app.listen(environment.PORT, "0.0.0.0", () => {
  console.log(`Dealership API listening on http://localhost:${environment.PORT}`);
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  }));
}
