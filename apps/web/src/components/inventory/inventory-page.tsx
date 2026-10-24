"use client";
import Image from "next/image";
import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SiteHeader from "../layout/site-header";
import { useSession } from "../../hooks/use-session";
import { useVehicles } from "../../hooks/use-vehicles";
import type { Vehicle, VehicleInput } from "../../lib/api/client";

const money = (value: string | number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(value));
const vehicleFields = ["make", "model", "category", "price", "quantity"] as const;
type SearchField = "make" | "model" | "category";
function readVehicle(form: HTMLFormElement): VehicleInput {
  const data = new FormData(form);
  return { make: String(data.get("make")), model: String(data.get("model")), category: String(data.get("category")), price: Number(data.get("price")), quantity: Number(data.get("quantity")) };
}

export default function InventoryPage({ adminOnly = false, editVehicleId }: { adminOnly?: boolean; editVehicleId?: string }) {
  const session = useSession();
  const router = useRouter();
  const admin = session.user?.role === "ADMIN";
  const stock = useVehicles(Boolean(session.user));
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showPaymentQr, setShowPaymentQr] = useState(false);
  const prices = stock.options.prices;

  useEffect(() => {
    if (!session.loading && !session.user) router.replace("/login");
    else if (!session.loading && adminOnly && session.user?.role !== "ADMIN") router.replace("/inventory");
  }, [session.loading, session.user, adminOnly, router]);

  if (session.loading || !session.user || (adminOnly && !admin)) return <main className="min-h-screen bg-[#f4f2ed] p-10">Loading secure inventory…</main>;

  async function act(fn: () => Promise<unknown>, message: string) {
    setActionError(""); setNotice("");
    try { await fn(); setNotice(message); }
    catch (cause) { setActionError(cause instanceof Error ? cause.message : "Action failed."); }
  }
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget;
    await act(async () => { await stock.create(readVehicle(form)); form.reset(); }, "Vehicle created and opening stock recorded.");
  }
  async function update(vehicle: Vehicle, event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget;
    await act(() => stock.update(vehicle.id, readVehicle(form)), "Vehicle details and stock updated.");
  }
  function updateFilter(key: keyof typeof stock.filters, value: string) {
    stock.setFilters({ ...stock.filters, [key]: value, page: 1 });
  }
  async function recordDemoPurchase() {
    if (!selectedVehicle) return;
    await act(() => stock.purchase(selectedVehicle), "Demo purchase recorded in the local database. No payment was verified.");
    setSelectedVehicle(null); setShowPaymentQr(false);
  }

  return <main className="min-h-screen bg-[#f4f2ed] text-[#17221e]"><SiteHeader/><section className="mx-auto max-w-7xl px-6 py-12">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#71833c]">{admin ? "Dealership operations" : "Current collection"}</p><h1 className="mt-2 text-4xl font-semibold">{admin ? "Manage inventory" : "Explore the collection"}</h1><p className="mt-2 text-sm text-[#66746c]">Signed in as {session.user.email} · {session.user.role.toLowerCase()}</p></div>{stock.pagination && <p className="text-sm text-[#66746c]">{stock.pagination.total} vehicles · page {stock.pagination.page} of {Math.max(1, stock.pagination.pageCount)}</p>}</div>

    {admin && <form onSubmit={create} className="my-8 grid gap-3 rounded-2xl border border-[#dce4d0] bg-[#f1f4e9] p-5 sm:grid-cols-2 lg:grid-cols-6"><h2 className="sm:col-span-2 lg:col-span-6 font-semibold">Add a vehicle</h2>{vehicleFields.map((field) => <label key={field} className="text-xs font-semibold capitalize text-[#66746c]">{field}<input name={field} required type={field === "price" || field === "quantity" ? "number" : "text"} min={field === "price" ? ".01" : field === "quantity" ? "0" : undefined} step={field === "price" ? ".01" : field === "quantity" ? "1" : undefined} className="mt-1 w-full rounded-lg border bg-white px-3 py-2.5 text-sm" /></label>)}<button className="self-end rounded-lg bg-[#71833c] px-4 py-2.5 font-semibold text-white">Add vehicle</button></form>}

    <form onSubmit={(event) => { event.preventDefault(); void stock.load({ ...stock.filters, page: 1 }); }} className="my-8 grid gap-3 rounded-2xl border bg-white p-4 sm:grid-cols-2 lg:grid-cols-6">
      {(["make", "model", "category"] as const).map((key: SearchField) => {
        const options = key === "make" ? stock.options.makes : key === "model" ? stock.options.models : stock.options.categories;
        return <label key={key} className="text-xs font-semibold capitalize text-[#66746c]">{key}<select value={stock.filters[key]} onChange={(event) => updateFilter(key, event.target.value)} className="mt-1 w-full rounded-lg border bg-white px-3 py-2.5 text-sm"><option value="">All {key}s</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
      })}
      <label className="text-xs font-semibold text-[#66746c]">Minimum price<select value={stock.filters.minPrice} onChange={(event) => updateFilter("minPrice", event.target.value)} className="mt-1 w-full rounded-lg border bg-white px-3 py-2.5 text-sm"><option value="">Any minimum</option>{prices.map((price) => <option key={`min-${price}`} value={price}>{money(price)} or more</option>)}</select></label>
      <label className="text-xs font-semibold text-[#66746c]">Maximum price<select value={stock.filters.maxPrice} onChange={(event) => updateFilter("maxPrice", event.target.value)} className="mt-1 w-full rounded-lg border bg-white px-3 py-2.5 text-sm"><option value="">Any maximum</option>{prices.map((price) => <option key={`max-${price}`} value={price}>Up to {money(price)}</option>)}</select></label>
      <button className="self-end rounded-lg bg-[#203d32] px-4 py-2.5 font-semibold text-white">Show matching vehicles</button>
      <p className="text-xs text-[#66746c] sm:col-span-2 lg:col-span-6">Dropdowns list makes, models, categories, and prices currently available in the database. Changing a filter refreshes matching results; use the buttons below to browse every matching page.</p>
    </form>

    {(stock.error || actionError) && <p role="alert" className="mb-4 rounded-lg bg-[#fae9e5] p-3 text-sm text-[#8d332b]">{actionError || stock.error}</p>}{notice && <p role="status" className="mb-4 rounded-lg bg-[#e9efdc] p-3 text-sm text-[#3f5a2d]">{notice}</p>}
    {stock.loading ? <p className="py-10 text-center">Loading inventory…</p> : stock.items.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{stock.items.map((vehicle, index) => <article key={vehicle.id} className="overflow-hidden rounded-2xl border bg-white"><div className={`flex h-40 items-end p-5 ${index % 3 === 1 ? "bg-[#dce3d2]" : index % 3 === 2 ? "bg-[#e9e1d4]" : "bg-[#dce6e5]"}`}><span className="rounded-full bg-white/80 px-3 py-1 text-xs font-bold uppercase">{vehicle.category}</span></div><div className="p-5"><div className="flex justify-between gap-3"><div><h2 className="text-xl font-semibold">{vehicle.make} {vehicle.model}</h2><p className="mt-1 text-sm text-[#66746c]">{vehicle.quantity} available</p></div><b>{money(vehicle.price)}</b></div>
      {admin && <details open={vehicle.id === editVehicleId} className="mt-4 rounded border p-3"><summary className="cursor-pointer text-sm font-semibold">Edit details and quantity</summary><form onSubmit={(event) => void update(vehicle, event)} className="mt-3 grid gap-2">{vehicleFields.map((field) => <label key={field} className="text-xs capitalize">{field}<input name={field} defaultValue={vehicle[field as keyof Vehicle] as string | number} required type={field === "price" || field === "quantity" ? "number" : "text"} min={field === "price" ? ".01" : field === "quantity" ? "0" : undefined} step={field === "price" ? ".01" : field === "quantity" ? "1" : undefined} className="mt-1 w-full rounded border px-2 py-1.5" /></label>)}<button className="rounded bg-[#71833c] p-2 text-sm font-semibold text-white">Save changes</button></form></details>}
      <div className="mt-5 flex gap-2">{admin ? <><Link href={`/admin/vehicles/${vehicle.id}/edit`} className="flex-1 rounded-lg border px-3 py-2 text-center text-sm font-semibold">Edit page</Link><button onClick={() => { const raw = window.prompt("Units to add?"); if (raw !== null) void act(() => stock.restock(vehicle.id, Number(raw)), "Stock restocked and ledger updated."); }} className="rounded-lg border px-3 py-2 text-sm font-semibold">Restock</button><button onClick={() => { if (window.confirm("Deactivate this vehicle? Purchase history will be preserved.")) void act(() => stock.remove(vehicle.id), "Vehicle removed from active inventory."); }} className="rounded-lg border px-3 py-2 text-sm text-[#9b443a]">Deactivate</button></> : <button disabled={!vehicle.quantity || stock.loading} onClick={() => { setSelectedVehicle(vehicle); setShowPaymentQr(false); }} className="w-full rounded-lg bg-[#203d32] px-4 py-2.5 font-semibold text-white disabled:bg-gray-400">{vehicle.quantity ? "View details & purchase" : "Unavailable"}</button>}</div></div></article>)}</div> : <div className="rounded-2xl border border-dashed bg-white px-6 py-14 text-center"><p className="font-serif text-2xl italic">No matching vehicles</p><p className="mt-2 text-sm text-[#66746c]">{admin ? "Create the first listing above, or adjust the search." : "Try adjusting your filters or check back later."}</p></div>}

    <div className="mt-8 flex justify-between"><button disabled={!stock.pagination || stock.pagination.page <= 1 || stock.loading} onClick={() => stock.setFilters({ ...stock.filters, page: stock.filters.page - 1 })} className="rounded border bg-white px-4 py-2 disabled:opacity-40">Previous</button><button disabled={!stock.pagination || stock.pagination.page >= stock.pagination.pageCount || stock.loading} onClick={() => stock.setFilters({ ...stock.filters, page: stock.filters.page + 1 })} className="rounded border bg-white px-4 py-2 disabled:opacity-40">Next</button></div>
    </section>

    {selectedVehicle && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) { setSelectedVehicle(null); setShowPaymentQr(false); } }}><section role="dialog" aria-modal="true" aria-labelledby="purchase-title" className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#71833c]">Vehicle details</p><h2 id="purchase-title" className="mt-2 text-2xl font-semibold">{selectedVehicle.make} {selectedVehicle.model}</h2></div><button aria-label="Close purchase dialog" onClick={() => { setSelectedVehicle(null); setShowPaymentQr(false); }} className="rounded-full border px-3 py-1">Close</button></div><dl className="mt-6 grid grid-cols-2 gap-4 rounded-xl bg-[#f7f7f1] p-4 text-sm"><div><dt className="text-[#66746c]">Category</dt><dd className="mt-1 font-semibold">{selectedVehicle.category}</dd></div><div><dt className="text-[#66746c]">Available</dt><dd className="mt-1 font-semibold">{selectedVehicle.quantity}</dd></div><div className="col-span-2"><dt className="text-[#66746c]">Listed price</dt><dd className="mt-1 text-xl font-semibold">{money(selectedVehicle.price)}</dd></div></dl><blockquote className="mt-5 rounded-lg border-l-4 border-[#71833c] bg-[#f7f7f1] p-4 text-sm italic">“I know this is a dummy app, but it’s month end and I’m low on money. Help with today’s dinner.”<footer className="mt-2 text-xs not-italic text-[#66746c]">Demo message for internal test staff</footer></blockquote><div className="mt-4 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900"><strong>Internal demo only.</strong> The supplied UPI QR may initiate a real payment. This app does not verify payment or connect to a payment processor; the record button below only exercises local inventory and purchase recording.</div>{showPaymentQr ? <div className="mt-5 rounded-xl border p-4 text-center"><Image src="/assets/test-staff-upi.jpeg" alt="Internal demo UPI payment QR code" width={384} height={512} className="mx-auto h-auto max-h-[50vh] w-auto rounded-lg"/><p className="mt-3 text-xs text-[#66746c]">Test-staff QR from the supplied image. Payment is not confirmed by this app.</p></div> : <button onClick={() => setShowPaymentQr(true)} className="mt-5 w-full rounded-lg border border-[#203d32] px-4 py-3 font-semibold text-[#203d32]">Open demo payment QR</button>}<button disabled={stock.loading || selectedVehicle.quantity < 1} onClick={() => void recordDemoPurchase()} className="mt-3 w-full rounded-lg bg-[#203d32] px-4 py-3 font-semibold text-white disabled:opacity-50">Record test purchase in local database</button><p className="mt-3 text-center text-xs text-[#66746c]">This will reduce local stock by one. It does not confirm, collect, or process payment.</p></section></div>}
  </main>;
}
