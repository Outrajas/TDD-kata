"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "../../hooks/use-session";

export default function SiteHeader() {
  const session = useSession(); const router = useRouter();
  async function signOut() { await session.logout(); router.push("/"); }
  return <header className="border-b border-[#d9ddd7] bg-[#f4f2ed]"><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5"><Link href="/" className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-[#203d32] text-lg text-[#dce7a5]">N</span><span><b className="block text-sm tracking-[.18em]">NORTHSTAR</b><small className="tracking-[.2em] text-[#66746c]">MOTOR COLLECTION</small></span></Link><nav className="flex items-center gap-4 text-sm">{session.user && <><Link href="/inventory">Inventory</Link>{session.user.role === "ADMIN" && <><Link href="/admin/dashboard">Dashboard</Link><Link href="/admin/vehicles">Manage stock</Link></>}<button onClick={() => void signOut()} className="font-semibold">Sign out</button></>}{!session.user && !session.loading && <><Link href="/login">Sign in</Link><Link href="/register" className="rounded-full bg-[#203d32] px-5 py-2.5 font-semibold text-white">Create account</Link></>}</nav></div></header>;
}
