"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "../../hooks/use-session";
import { useDatabaseStatus } from "../../hooks/use-database-status";

export default function SiteHeader() {
  const session = useSession(); const router = useRouter(); const database = useDatabaseStatus();
  async function signOut() { await session.logout(); router.push("/"); }
  return <header className="border-b border-[#d9ddd7] bg-[#f4f2ed]"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-5"><Link href="/" className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-[#203d32] text-lg text-[#dce7a5]">T</span><span><b className="block text-sm tracking-[.18em]">TDD KATA</b><small className="tracking-[.12em] text-[#66746c]">CAR DEALERSHIP INVENTORY</small></span></Link><div className="flex items-center gap-4"><span title={database.error || "Database readiness"} className={`text-xs ${database.connected ? "text-green-800" : "text-red-800"}`}>● DB {database.connected ? "connected" : database.loading ? "checking" : "unavailable"}</span><nav className="flex items-center gap-4 text-sm">{session.user && <><Link href="/inventory">Inventory</Link>{session.user.role === "ADMIN" && <><Link href="/admin/dashboard">Dashboard</Link><Link href="/admin/vehicles">Manage stock</Link></>}<button onClick={() => void signOut()} className="font-semibold">Sign out</button></>}{!session.user && !session.loading && <><Link href="/login">Customer sign in</Link><Link href="/admin/login">Admin sign in</Link><Link href="/register" className="rounded-full bg-[#203d32] px-5 py-2.5 font-semibold text-white">Create account</Link></>}</nav></div></div></header>;
}
