import type { AdminRepository } from "./admin.repository.js";

export type AdminRepositoryPort = Pick<AdminRepository, "dashboard">;
export class AdminService {
  constructor(private readonly repository: AdminRepositoryPort) {}
  getDashboard() { return this.repository.dashboard(); }
}
