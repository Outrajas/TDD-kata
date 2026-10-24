"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, type DashboardData } from "../../lib/api/client";
import { useSession } from "../../hooks/use-session";
import SiteHeader from "../layout/site-header";

export default function AdminDashboard() {
  const session = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!session.loading && !session.user) router.replace("/login");
    else if (!session.loading && session.user?.role !== "ADMIN") router.replace("/inventory");
  }, [session.loading, session.user, router]);

  useEffect(() => {
    if (!session.user || session.user.role !== "ADMIN") return;
    let active = true;
    const refresh = async () => {
      setRefreshing(true);
      try { const result = await api<DashboardData>("/admin/dashboard"); if (active) { setData(result); setError(""); } }
      catch (cause) { if (active) setError(cause instanceof Error ? cause.message : "Dashboard data could not be loaded."); }
      finally { if (active) setRefreshing(false); }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 10_000);
    return () => { active = false; window.clearInterval(timer); };
  }, [session.user]);

  if (session.loading || !session.user || session.user.role !== "ADMIN") return <main className="min-h-screen bg-[#f4f2ed] p-10">Loading admin dashboard…</main>;
  const stats = data?.metrics;
  const number = (value: number | undefined) => new Intl.NumberFormat("en-US").format(value ?? 0);
  const cards = [["Registered users", stats?.totalUsers], ["Customers", stats?.customers], ["Administrators", stats?.admins], ["Active listings", stats?.activeVehicles], ["Units in stock", stats?.availableUnits], ["Recorded purchases", stats?.purchases]] as const;
  return (
    <main className="min-h-screen bg-[#f4f2ed] text-[#17221e]">
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#71833c]">Operations overview</p><h1 className="mt-2 text-4xl font-semibold">Admin dashboard</h1><p className="mt-2 text-sm text-[#66746c]">User and inventory data refreshes every 10 seconds.</p></div>
          <div className="text-right text-xs text-[#66746c]"><p>{refreshing ? "Updating…" : "Live refresh enabled"}</p>{data && <p>Updated {new Date(data.generatedAt).toLocaleTimeString()}</p>}</div>
        </div>
        {error && <p role="alert" className="mt-5 rounded-lg bg-[#fae9e5] p-3 text-sm text-[#8d332b]">{error}</p>}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map(([label, value]) => <article key={label} className="rounded-2xl border border-[#e5e6df] bg-white p-6"><p className="text-sm text-[#66746c]">{label}</p><p className="mt-3 text-3xl font-semibold">{number(value ?? undefined)}</p></article>)}
        </div>
        <section className="mt-10 overflow-hidden rounded-2xl border border-[#e5e6df] bg-white">
          <div className="flex items-center justify-between border-b px-6 py-5"><div><h2 className="text-xl font-semibold">All registered users</h2><p className="mt-1 text-sm text-[#66746c]">Account list from the database, newest first.</p></div><span className="rounded-full bg-[#e9efdc] px-3 py-1 text-xs font-semibold text-[#3f5a2d]">{data?.users.length ?? 0} accounts</span></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-[#f7f7f1] text-xs uppercase tracking-wide text-[#66746c]"><tr><th className="px-6 py-3">Email</th><th className="px-6 py-3">Role</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Created</th></tr></thead>
            <tbody className="divide-y">
              {data?.users.map((user) => (
                <tr key={user.id}><td className="px-6 py-4 font-medium">{user.email}</td><td className="px-6 py-4">{user.role.toLowerCase()}</td><td className="px-6 py-4">{user.isActive ? "Active" : "Disabled"}</td><td className="px-6 py-4">{new Date(user.createdAt).toLocaleString()}</td></tr>
              ))}
              {data?.users.length === 0 && <tr><td colSpan={4} className="px-6 py-10 text-center text-[#66746c]">No users have registered yet.</td></tr>}
            </tbody>
          </table></div>
        </section>
        <p className="mt-4 text-xs text-[#66746c]">This dashboard reports registered accounts, not online presence. No user is shown as currently online because the app does not track live sessions.</p>
      </section>
    </main>
  );
}
