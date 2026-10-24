"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import { buildVehicleSearchQuery, canPurchase } from "../lib/inventory";

type User = { id: string; email: string; role: "CUSTOMER" | "ADMIN" };
type Vehicle = { id: string; make: string; model: string; category: string; price: string | number; quantity: number };
type ApiResult<T> = { data: T };
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API}/api${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  if (response.status === 204) return undefined as T;
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error?.message ?? "The request could not be completed.");
  return payload as T;
}

const formatPrice = (price: Vehicle["price"]) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(price));

export default function DealershipApp() {
  const [user, setUser] = useState<User | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [filters, setFilters] = useState({ make: "", model: "", category: "", minPrice: "", maxPrice: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (window.location.hash === "#register") setMode("register");
  }, []);

  const loadVehicles = useCallback(async (criteria = filters) => {
    const query = buildVehicleSearchQuery(criteria);
    const result = await request<ApiResult<{ items: Vehicle[] }>>(`/vehicles/search?${query}`);
    setVehicles(result.data.items);
  }, [filters]);

  useEffect(() => {
    const saved = window.localStorage.getItem("dealership-user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as User;
        setUser(parsed);
        void loadVehicles().catch(() => {
          window.localStorage.removeItem("dealership-user");
          setUser(null);
        });
      } catch {
        window.localStorage.removeItem("dealership-user");
      }
    }
  }, [loadVehicles]);

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setNotice(""); setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      if (mode === "register") {
        await request("/auth/register", { method: "POST", body: JSON.stringify({ email: form.get("email"), password: form.get("password") }) });
        setNotice("Account created. Sign in to browse the inventory."); setMode("login");
      } else {
        const result = await request<ApiResult<{ user: User }>>("/auth/login", { method: "POST", body: JSON.stringify({ email: form.get("email"), password: form.get("password") }) });
        setUser(result.data.user); window.localStorage.setItem("dealership-user", JSON.stringify(result.data.user));
        await loadVehicles();
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Sign-in failed."); }
    finally { setBusy(false); }
  }

  async function logout() {
    await request("/auth/logout", { method: "POST" });
    setUser(null); setVehicles([]); window.localStorage.removeItem("dealership-user"); setNotice("You are signed out.");
  }

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setBusy(true);
    try { await loadVehicles(filters); } catch (cause) { setError(cause instanceof Error ? cause.message : "Search failed."); }
    finally { setBusy(false); }
  }

  async function purchase(vehicle: Vehicle) {
    setError(""); setNotice(""); setBusy(true);
    try {
      await request(`/vehicles/${vehicle.id}/purchase`, { method: "POST", headers: { "Idempotency-Key": crypto.randomUUID() } });
      setNotice(`${vehicle.make} ${vehicle.model} purchased successfully.`);
      await loadVehicles();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Purchase failed."); }
    finally { setBusy(false); }
  }

  async function createVehicle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setNotice("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await request("/vehicles", { method: "POST", body: JSON.stringify({ make: form.get("make"), model: form.get("model"), category: form.get("category"), price: Number(form.get("price")), quantity: Number(form.get("quantity")) }) });
      formElement.reset(); setNotice("Vehicle added to inventory."); await loadVehicles();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not add vehicle."); }
  }

  async function updateVehicle(id: string, event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setNotice("");
    const form = new FormData(event.currentTarget);
    try {
      await request(`/vehicles/${id}`, { method: "PUT", body: JSON.stringify({ make: form.get("make"), model: form.get("model"), category: form.get("category"), price: Number(form.get("price")), quantity: Number(form.get("quantity")) }) });
      setNotice("Vehicle details updated."); await loadVehicles();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update vehicle."); }
  }

  async function restock(id: string) {
    const value = window.prompt("How many units should be added?");
    if (value === null) return;
    const quantity = Number(value);
    if (!Number.isInteger(quantity) || quantity < 1) { setError("Enter a positive whole number."); return; }
    try { await request(`/vehicles/${id}/restock`, { method: "POST", body: JSON.stringify({ quantity }) }); setNotice("Inventory restocked."); await loadVehicles(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Restock failed."); }
  }

  async function removeVehicle(id: string) {
    if (!window.confirm("Remove this vehicle from the active inventory?")) return;
    try { await request(`/vehicles/${id}`, { method: "DELETE" }); setNotice("Vehicle removed from active inventory."); await loadVehicles(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Delete failed."); }
  }

  return (
    <main className="min-h-screen bg-[#f4f2ed] text-[#17221e]">
      <header className="border-b border-[#d9ddd7] bg-[#f4f2ed]/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <a href="#top" className="flex items-center gap-3" aria-label="Northstar Motors home">
            <span className="grid size-10 place-items-center rounded-full bg-[#203d32] text-lg text-[#dce7a5]">N</span>
            <span><span className="block text-sm font-bold tracking-[0.18em]">NORTHSTAR</span><span className="block text-[10px] tracking-[0.25em] text-[#66746c]">MOTOR COLLECTION</span></span>
          </a>
          <nav className="flex items-center gap-5 text-sm">
            {user ? <><span className="hidden text-[#66746c] sm:inline">{user.email} · {user.role.toLowerCase()}</span><button onClick={logout} className="font-semibold hover:text-[#71833c]">Sign out</button></> : <a href="#account" className="font-semibold hover:text-[#71833c]">Sign in</a>}
            <a href="#inventory" className="rounded-full bg-[#203d32] px-5 py-2.5 font-semibold text-white hover:bg-[#315746]">Explore inventory</a>
          </nav>
        </div>
      </header>

      <section id="top" className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-[1.05fr_.95fr] md:items-center md:py-24">
        <div>
          <p className="mb-5 text-xs font-bold uppercase tracking-[0.23em] text-[#71833c]">Curated for the road ahead</p>
          <h1 className="max-w-2xl text-5xl font-semibold leading-[1.05] tracking-[-0.045em] sm:text-7xl">Find the drive <span className="font-serif italic text-[#71833c]">that feels like you.</span></h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-[#66746c]">A considered collection of exceptional vehicles, selected for the journeys still to come.</p>
          <a href="#inventory" className="mt-8 inline-flex items-center gap-3 rounded-full bg-[#203d32] px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-[#315746]">Discover the collection <span aria-hidden="true">↗</span></a>
        </div>
        <div className="relative min-h-[330px] overflow-hidden rounded-[2rem] bg-[#263d33] p-8 text-[#eff1e5] sm:min-h-[430px] sm:p-12">
          <div className="absolute inset-0 opacity-25" style={{ backgroundImage: "radial-gradient(ellipse at 70% 35%, #c6d17a 0%, transparent 45%), linear-gradient(145deg, transparent 48%, #101c18 49%, #101c18 52%, transparent 53%)" }} />
          <div className="relative flex h-full min-h-[265px] flex-col justify-between sm:min-h-[330px]">
            <p className="text-xs uppercase tracking-[0.22em] text-[#d7e39b]">The Northstar standard</p>
            <div><p className="font-serif text-5xl italic sm:text-6xl">A little more<br />meaning in motion.</p><p className="mt-5 max-w-xs text-sm leading-6 text-[#c7d0c9]">Thoughtful details. Lasting character. A collection worth taking your time with.</p></div>
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-[#d7e39b]"><span className="h-px w-10 bg-[#d7e39b]" /> EST. FOR THE JOURNEY</div>
          </div>
        </div>
      </section>

      <section id="inventory" className="bg-[#fffefa] px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-9 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#71833c]">Our current collection</p><h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Vehicles with a story.</h2></div><p className="max-w-sm text-sm leading-6 text-[#66746c]">Sign in to explore available vehicles, refine your search, and make your next move.</p></div>
          {user ? <>
            <form onSubmit={search} className="mb-8 grid gap-3 rounded-2xl border border-[#e3e5dc] bg-[#f7f7f1] p-4 sm:grid-cols-2 lg:grid-cols-6" aria-label="Search inventory">
              <label className="text-xs font-semibold text-[#66746c]">Make<input value={filters.make} onChange={e => setFilters({ ...filters, make: e.target.value })} className="mt-1 w-full rounded-lg border border-[#d9ddd7] bg-white px-3 py-2.5 text-sm text-[#17221e]" placeholder="e.g. Volvo" /></label>
              <label className="text-xs font-semibold text-[#66746c]">Model<input value={filters.model} onChange={e => setFilters({ ...filters, model: e.target.value })} className="mt-1 w-full rounded-lg border border-[#d9ddd7] bg-white px-3 py-2.5 text-sm text-[#17221e]" placeholder="e.g. XC60" /></label>
              <label className="text-xs font-semibold text-[#66746c]">Category<input value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })} className="mt-1 w-full rounded-lg border border-[#d9ddd7] bg-white px-3 py-2.5 text-sm text-[#17221e]" placeholder="SUV" /></label>
              <label className="text-xs font-semibold text-[#66746c]">Min price<input type="number" min="0" value={filters.minPrice} onChange={e => setFilters({ ...filters, minPrice: e.target.value })} className="mt-1 w-full rounded-lg border border-[#d9ddd7] bg-white px-3 py-2.5 text-sm text-[#17221e]" placeholder="$" /></label>
              <label className="text-xs font-semibold text-[#66746c]">Max price<input type="number" min="0" value={filters.maxPrice} onChange={e => setFilters({ ...filters, maxPrice: e.target.value })} className="mt-1 w-full rounded-lg border border-[#d9ddd7] bg-white px-3 py-2.5 text-sm text-[#17221e]" placeholder="$" /></label>
              <button disabled={busy} className="self-end rounded-lg bg-[#203d32] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Searching…" : "Search"}</button>
            </form>
            {user.role === "ADMIN" && <form onSubmit={createVehicle} className="mb-8 grid gap-3 rounded-2xl border border-[#dce4d0] bg-[#f1f4e9] p-5 sm:grid-cols-2 lg:grid-cols-6" aria-label="Add vehicle"><div className="sm:col-span-2 lg:col-span-6"><h3 className="font-semibold">Add to the collection</h3><p className="mt-1 text-xs text-[#66746c]">New listings and stock updates are recorded in the inventory history.</p></div>{(["make", "model", "category", "price", "quantity"] as const).map(field => <label key={field} className="text-xs font-semibold capitalize text-[#66746c]">{field}<input name={field} required type={field === "price" || field === "quantity" ? "number" : "text"} min={field === "price" ? "0.01" : field === "quantity" ? "0" : undefined} step={field === "price" ? "0.01" : field === "quantity" ? "1" : undefined} className="mt-1 w-full rounded-lg border border-[#d9ddd7] bg-white px-3 py-2.5 text-sm text-[#17221e]" /></label>)}<button className="self-end rounded-lg bg-[#71833c] px-4 py-2.5 text-sm font-semibold text-white">Add vehicle</button></form>}
            {vehicles.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{vehicles.map((vehicle, index) => <article key={vehicle.id} className="overflow-hidden rounded-2xl border border-[#e5e6df] bg-white">
              <div className={`relative flex h-48 items-end overflow-hidden p-5 ${index % 3 === 1 ? "bg-[#dce3d2]" : index % 3 === 2 ? "bg-[#e9e1d4]" : "bg-[#dce6e5]"}`}><div className="absolute inset-0 opacity-60" style={{ backgroundImage: "linear-gradient(150deg, transparent 45%, rgba(32,61,50,.16) 46%, rgba(32,61,50,.16) 48%, transparent 49%), radial-gradient(ellipse at 55% 75%, rgba(32,61,50,.2), transparent 55%)" }} /><span className="relative rounded-full bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#53654f]">{vehicle.category}</span><span className="absolute right-5 top-5 font-serif text-4xl italic text-[#203d32]/50">N°{String(index + 1).padStart(2, "0")}</span></div>
              <div className="p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="text-xl font-semibold">{vehicle.make} {vehicle.model}</h3><p className="mt-1 text-sm text-[#66746c]">{vehicle.quantity} available</p></div><p className="whitespace-nowrap text-lg font-semibold">{formatPrice(vehicle.price)}</p></div>{user.role === "ADMIN" && <details className="mt-4 rounded-lg border border-[#e5e6df] px-3 py-2"><summary className="cursor-pointer text-sm font-semibold">Edit details</summary><form onSubmit={event => updateVehicle(vehicle.id, event)} className="mt-3 grid gap-2"><label className="text-xs text-[#66746c]">Make<input name="make" defaultValue={vehicle.make} required className="mt-1 w-full rounded border px-2 py-1.5 text-sm text-[#17221e]" /></label><label className="text-xs text-[#66746c]">Model<input name="model" defaultValue={vehicle.model} required className="mt-1 w-full rounded border px-2 py-1.5 text-sm text-[#17221e]" /></label><label className="text-xs text-[#66746c]">Category<input name="category" defaultValue={vehicle.category} required className="mt-1 w-full rounded border px-2 py-1.5 text-sm text-[#17221e]" /></label><div className="grid grid-cols-2 gap-2"><label className="text-xs text-[#66746c]">Price<input name="price" type="number" min="0.01" step="0.01" defaultValue={vehicle.price} required className="mt-1 w-full rounded border px-2 py-1.5 text-sm text-[#17221e]" /></label><label className="text-xs text-[#66746c]">Quantity<input name="quantity" type="number" min="0" step="1" defaultValue={vehicle.quantity} required className="mt-1 w-full rounded border px-2 py-1.5 text-sm text-[#17221e]" /></label></div><button className="rounded-lg bg-[#71833c] px-3 py-2 text-sm font-semibold text-white">Save changes</button></form></details>}<div className="mt-5 flex gap-2"><button onClick={() => purchase(vehicle)} disabled={!canPurchase(vehicle.quantity, busy)} className="flex-1 rounded-lg bg-[#203d32] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#b7beb8]">{vehicle.quantity < 1 ? "Unavailable" : "Purchase"}</button>{user.role === "ADMIN" && <><button onClick={() => void restock(vehicle.id)} className="rounded-lg border border-[#d9ddd7] px-3 py-2 text-sm font-semibold">Restock</button><button onClick={() => void removeVehicle(vehicle.id)} aria-label={`Remove ${vehicle.make} ${vehicle.model}`} className="rounded-lg border border-[#d9ddd7] px-3 py-2 text-sm text-[#9b443a]">Remove</button></>}</div></div>
            </article>)}</div> : <div className="rounded-2xl border border-dashed border-[#cbd3c7] bg-[#f7f7f1] px-6 py-14 text-center"><p className="font-serif text-2xl italic">A collection takes shape.</p><p className="mt-2 text-sm text-[#66746c]">No matching vehicles are available right now. Try another search or check back soon.</p></div>}
          </> : <div className="grid gap-8 rounded-2xl border border-[#e5e6df] bg-[#f7f7f1] p-6 md:grid-cols-[1fr_1fr] md:p-8">
            <div className="flex flex-col justify-center"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#71833c]">Your next chapter starts here</p><h3 className="mt-3 max-w-sm text-3xl font-semibold tracking-tight">Take a closer look at the collection.</h3><p className="mt-3 max-w-md text-sm leading-6 text-[#66746c]">Create an account or sign in to search available vehicles and purchase directly from our collection.</p></div>
            <div id="account" className="rounded-xl bg-white p-5 sm:p-7"><div className="mb-5 flex gap-5 border-b border-[#e5e6df]"><button onClick={() => { setMode("login"); setError(""); }} className={`pb-3 text-sm font-semibold ${mode === "login" ? "border-b-2 border-[#71833c] text-[#203d32]" : "text-[#89938c]"}`}>Sign in</button><button onClick={() => { setMode("register"); setError(""); }} className={`pb-3 text-sm font-semibold ${mode === "register" ? "border-b-2 border-[#71833c] text-[#203d32]" : "text-[#89938c]"}`}>Create account</button></div><form onSubmit={submitAuth} className="space-y-4"><label className="block text-sm font-medium">Email<input name="email" type="email" required autoComplete="email" className="mt-1.5 w-full rounded-lg border border-[#d9ddd7] px-3 py-2.5 outline-none focus:border-[#71833c] focus:ring-2 focus:ring-[#71833c]/20" placeholder="you@example.com" /></label><label className="block text-sm font-medium">Password<input name="password" type="password" required minLength={mode === "register" ? 10 : 1} autoComplete={mode === "register" ? "new-password" : "current-password"} className="mt-1.5 w-full rounded-lg border border-[#d9ddd7] px-3 py-2.5 outline-none focus:border-[#71833c] focus:ring-2 focus:ring-[#71833c]/20" placeholder={mode === "register" ? "10+ characters, upper/lowercase and a number" : "Your password"} /></label><button disabled={busy} className="w-full rounded-lg bg-[#203d32] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create customer account"}</button></form></div>
          </div>}
          {error && <p role="alert" className="mt-5 rounded-lg bg-[#fae9e5] px-4 py-3 text-sm text-[#8d332b]">{error}</p>}{notice && <p role="status" className="mt-5 rounded-lg bg-[#e9efdc] px-4 py-3 text-sm text-[#3f5a2d]">{notice}</p>}
        </div>
      </section>
      <footer className="bg-[#203d32] px-6 py-10 text-[#dfe6d8]"><div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-5"><div><p className="text-sm font-bold tracking-[0.18em]">NORTHSTAR MOTORS</p><p className="mt-2 text-xs text-[#b7c4b5]">Thoughtfully chosen. Ready for the road.</p></div><p className="text-xs text-[#b7c4b5]">© 2026 Northstar Motors · Built for your next journey</p></div></footer>
    </main>
  );
}
