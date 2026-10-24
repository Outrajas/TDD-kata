import { z } from "zod";

const environmentSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  WEB_ORIGIN: z.string().url().default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export function loadEnvironment(source: NodeJS.ProcessEnv = process.env) {
  const parsed = environmentSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error(`Invalid API environment: ${parsed.error.message}`);
  }
  return parsed.data;
}
