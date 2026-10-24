import { SignJWT } from "jose";
import { compare, hash } from "bcryptjs";
import { ApiError } from "../../shared/api-error.js";
import type { LoginInput, RegisterInput } from "@dealership/contracts";
import type { AuthRepository } from "./auth.repository.js";

export type AuthRepositoryPort = Pick<AuthRepository, "findByNormalizedEmail" | "createCustomer">;

export class AuthService {
  constructor(private readonly repository: AuthRepositoryPort, private readonly secret: string) {}

  async register(input: RegisterInput) {
    const emailNormalized = input.email.trim().toLowerCase();
    const existing = await this.repository.findByNormalizedEmail(emailNormalized);
    if (existing) throw new ApiError(409, "EMAIL_EXISTS", "An account with this email already exists.");
    const passwordHash = await hash(input.password, 12);
    try {
      const user = await this.repository.createCustomer(emailNormalized, passwordHash);
      return this.publicUser(user);
    } catch (error) {
      if (isUniqueError(error)) throw new ApiError(409, "EMAIL_EXISTS", "An account with this email already exists.");
      throw error;
    }
  }

  async login(input: LoginInput) {
    const emailNormalized = input.email.trim().toLowerCase();
    const user = await this.repository.findByNormalizedEmail(emailNormalized);
    if (!user || !user.isActive || !(await compare(input.password, user.passwordHash))) {
      throw new ApiError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
    }
    const token = await new SignJWT({ role: user.role })
      .setProtectedHeader({ alg: "HS256" }).setSubject(user.id).setIssuedAt().setExpirationTime("15m").sign(new TextEncoder().encode(this.secret));
    return { user: this.publicUser(user), token };
  }

  private publicUser(user: { id: string; email: string; role: string; createdAt: Date }) {
    return { id: user.id, email: user.email, role: user.role, createdAt: user.createdAt.toISOString() };
  }
}

function isUniqueError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}
