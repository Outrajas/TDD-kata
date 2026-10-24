"use client";
import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "../../hooks/use-session";

const passwordRules = [
  { label: "10 or more characters", reason: "Longer passwords are harder to guess.", test: (value: string) => value.length >= 10 },
  { label: "No more than 128 characters", reason: "The API caps password length to keep requests bounded.", test: (value: string) => value.length <= 128 },
  { label: "One lowercase letter (a–z)", reason: "This is a format requirement for customer accounts.", test: (value: string) => /[a-z]/.test(value) },
  { label: "One uppercase letter (A–Z)", reason: "This is a format requirement for customer accounts.", test: (value: string) => /[A-Z]/.test(value) },
  { label: "One number (0–9)", reason: "This is a format requirement for customer accounts.", test: (value: string) => /[0-9]/.test(value) },
];

export default function AuthForm({ mode, registered = false, admin = false }: { mode: "login" | "register"; registered?: boolean; admin?: boolean }) {
  const session = useSession();
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const value = String(form.get("password"));
    if (mode === "register" && passwordRules.some((rule) => !rule.test(value))) {
      setError("Finish each password requirement below before creating the account.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "register") {
        await session.register(email, value);
        router.push("/login?registered=1");
      } else {
        const user = await session.login(email, value, admin);
        router.push(user.role === "ADMIN" ? "/admin/dashboard" : "/inventory");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="min-h-screen bg-slate-900 text-slate-100"><div className="mx-auto max-w-lg px-6 py-16"><Link href="/" className="text-sm font-semibold text-[#71833c]">← TDD Kata</Link><section className="mt-8 rounded-2xl border border-[#e5e6df] bg-slate-800 p-7 sm:p-10"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#71833c]">{admin ? "Administrator access" : mode === "login" ? "Customer access" : "Customer registration"}</p><h1 className="mt-2 text-3xl font-semibold">{admin ? "Admin sign in" : mode === "login" ? "Customer sign in" : "Create your account"}</h1>{registered && <p role="status" className="mt-4 rounded-lg bg-[#e9efdc] p-3 text-sm text-[#3f5a2d]">Your customer account is ready. Sign in to continue.</p>}<form onSubmit={submit} className="mt-7 space-y-5"><label className="block text-sm font-medium">{admin ? "Admin ID (email)" : "Email"}<input name="email" type="email" required autoComplete="username" className="mt-1.5 w-full rounded-lg border px-3 py-3" /></label><label className="block text-sm font-medium">Password<span className="mt-1.5 flex rounded-lg border"><input name="password" type={showPassword ? "text" : "password"} required minLength={mode === "register" ? 10 : 1} maxLength={mode === "register" ? 128 : undefined} autoComplete={mode === "register" ? "new-password" : "current-password"} value={mode === "register" ? password : undefined} onChange={mode === "register" ? (event) => setPassword(event.target.value) : undefined} className="min-w-0 flex-1 rounded-lg px-3 py-3 outline-none" /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((visible) => !visible)} className="px-3 text-xs font-semibold text-[#203d32]">{showPassword ? "Hide" : "Show"}</button></span></label>{mode === "register" && <section aria-live="polite" className="-mt-2 rounded-lg bg-[#f7f7f1] p-4"><h2 className="text-sm font-semibold">Password requirements</h2><p className="mt-1 text-xs text-[#66746c]">The API requires each rule. Uppercase and lowercase are separate checks; include at least one of each.</p><ul className="mt-3 space-y-2">{passwordRules.map((rule) => { const met = rule.test(password); return <li key={rule.label} className={`text-xs ${met ? "text-[#3f6b35]" : "text-[#66746c]"}`}><span className="font-bold">{met ? "✓ " : "○ "}{rule.label}</span><span className="block pl-5 opacity-80">{rule.reason}</span></li>; })}</ul></section>}<button disabled={busy} className="w-full rounded-lg bg-[#203d32] px-4 py-3 font-semibold text-white disabled:opacity-50">{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create customer account"}</button></form>{error && <p role="alert" className="mt-4 rounded-lg bg-[#fae9e5] p-3 text-sm text-[#8d332b]">{error}</p>}<p className="mt-6 text-sm text-[#66746c]">{mode === "register" ? <>Already registered? <Link className="font-semibold text-[#203d32]" href="/login">Customer sign in</Link></> : admin ? <>Customer? <Link className="font-semibold text-[#203d32]" href="/login">Sign in here</Link></> : <>New here? <Link className="font-semibold text-[#203d32]" href="/register">Create an account</Link> · <Link className="font-semibold text-[#203d32]" href="/admin/login">Admin sign in</Link></>}</p></section></div></main>;
}
