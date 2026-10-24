"use client";
import { useParams } from "next/navigation";
import InventoryPage from "../../../../../components/inventory/inventory-page";
export default function EditVehiclePage() {
  const params = useParams<{ id: string }>();
  return <InventoryPage adminOnly editVehicleId={params.id} />;
}
