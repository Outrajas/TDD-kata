"use client";
import { useCallback, useEffect, useState } from "react";
import { api, queryString, type Filters, type SearchOptions, type Vehicle, type VehicleInput, type VehiclePage } from "../lib/api/client";

const emptyFilters: Filters = { make: "", model: "", category: "", minPrice: "", maxPrice: "", page: 1, pageSize: 20 };
export function useVehicles(enabled = true) {
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [items, setItems] = useState<Vehicle[]>([]);
  const [pagination, setPagination] = useState<VehiclePage["pagination"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [options, setOptions] = useState<SearchOptions>({ makes: [], models: [], categories: [], prices: [] });
  const load = useCallback(async (next = filters) => {
    setLoading(true); setError("");
    try { const page = await api<VehiclePage>(`/vehicles/search?${queryString(next)}`); setItems(page.items); setPagination(page.pagination); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Inventory could not be loaded."); }
    finally { setLoading(false); }
  }, [filters]);
  useEffect(() => { if (enabled) void load(); }, [enabled, load]);
  useEffect(() => { if (enabled) void api<SearchOptions>("/vehicles/options").then(setOptions).catch((cause) => setError(cause instanceof Error ? cause.message : "Search options could not be loaded.")); }, [enabled]);
  const mutate = async (path: string, method: string, body?: unknown, extraHeaders?: Record<string, string>) => {
    const result = await api<Vehicle>(path, { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }), headers: extraHeaders });
    await load(); return result;
  };
  const create = (body: VehicleInput) => mutate("/vehicles", "POST", body);
  const update = (id: string, body: VehicleInput) => mutate(`/vehicles/${id}`, "PUT", body);
  const remove = async (id: string) => { await api<void>(`/vehicles/${id}`, { method: "DELETE" }); await load(); };
  const restock = (id: string, quantity: number, note?: string) => mutate(`/vehicles/${id}/restock`, "POST", { quantity, ...(note ? { note } : {}) });
  const purchase = (vehicle: Vehicle) => mutate(`/vehicles/${vehicle.id}/purchase`, "POST", undefined, { "Idempotency-Key": crypto.randomUUID() });
  return { items, pagination, filters, setFilters, options, loading, error, load, create, update, remove, restock, purchase };
}
