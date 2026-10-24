export type User = { id: string; email: string; role: "CUSTOMER" | "ADMIN" };
export type Vehicle = { id: string; make: string; model: string; category: string; price: string; quantity: number };
export type VehicleInput = Omit<Vehicle, "id" | "price"> & { price: number };
export type Filters = { make: string; model: string; category: string; minPrice: string; maxPrice: string; page: number; pageSize: number };
export type VehiclePage = { items: Vehicle[]; pagination: { page: number; pageSize: number; total: number; pageCount: number } };
export type SearchOptions = { makes: string[]; models: string[]; categories: string[]; prices: string[] };
export type DashboardData = {
  metrics: { totalUsers: number; customers: number; admins: number; activeVehicles: number; availableUnits: number; purchases: number };
  users: Array<{ id: string; email: string; role: "CUSTOMER" | "ADMIN"; isActive: boolean; createdAt: string }>;
  generatedAt: string;
};
type Envelope<T> = { data: T };
const API = process.env.NEXT_PUBLIC_API_URL ?? (process.env.NODE_ENV === "production" ? "" : "http://localhost:3001");

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API}/api${path}`, { ...init, credentials: "include", headers: { "Content-Type": "application/json", ...init.headers } });
  if (response.status === 204) return undefined as T;
  const payload = await response.json() as Envelope<T> & { error?: { message?: string } };
  if (!response.ok) throw new Error(payload.error?.message ?? "The request could not be completed.");
  return payload.data;
}

export function queryString(filters: Partial<Filters>) {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => { if (value !== undefined && String(value).trim()) query.set(key, String(value).trim()); });
  return query.toString();
}
