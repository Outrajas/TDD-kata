export type VehicleFilters = {
  make: string;
  model: string;
  category: string;
  minPrice: string;
  maxPrice: string;
};

export function buildVehicleSearchQuery(filters: VehicleFilters): URLSearchParams {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value.trim()) query.set(key, value.trim());
  }
  return query;
}

export function canPurchase(quantity: number, busy: boolean): boolean {
  return quantity > 0 && !busy;
}
