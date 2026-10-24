import "dotenv/config";
import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "../src/db.js";

const emailResult = z.string().trim().email().max(320).safeParse(process.env.ADMIN_EMAIL);
const passwordResult = z.string().min(10).max(128).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/).safeParse(process.env.ADMIN_PASSWORD);
if (!emailResult.success || !passwordResult.success) {
  throw new Error("Set ADMIN_EMAIL and a strong ADMIN_PASSWORD in the environment before running db:seed:admin.");
}

try {
  const emailNormalized = emailResult.data.toLowerCase();
  const passwordHash = await hash(passwordResult.data, 12);
  await prisma.user.upsert({
    where: { emailNormalized },
    create: { email: emailNormalized, emailNormalized, passwordHash, role: "ADMIN" },
    update: { role: "ADMIN", isActive: true },
  });
  console.log(`Administrator account is ready for ${emailNormalized}.`);
} finally {
  await prisma.$disconnect();
}
