"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { apiFetch } from "../lib/api";
import { Disclaimer } from "../components/site-chrome";
export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [error, setError] = useState<string>(); const [loading, setLoading] = useState(false); const router = useRouter();
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setLoading(true); setError(undefined); const data = new FormData(event.currentTarget); try { await apiFetch(`/api/auth/${mode}`, { method: "POST", body: JSON.stringify(Object.fromEntries(data)) }); router.push("/dashboard"); } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to continue."); } finally { setLoading(false); } }
  const signingUp = mode === "signup";
  return <div className="mx-auto max-w-md px-5 py-20"><form onSubmit={submit} className="glass rounded-3xl p-7"><p className="text-sm font-medium text-[#61e6cf]">{signingUp ? "Create workspace" : "Welcome back"}</p><h1 className="mt-3 text-3xl font-semibold">{signingUp ? "Build a safer scenario." : "Sign in to Credora."}</h1>{signingUp && <label className="mt-6 block text-sm">Name<input className="input mt-2" name="name" minLength={2} required /></label>}<label className="mt-5 block text-sm">Email<input className="input mt-2" name="email" type="email" autoComplete="email" required /></label><label className="mt-5 block text-sm">Password<input className="input mt-2" name="password" type="password" autoComplete={signingUp ? "new-password" : "current-password"} minLength={signingUp ? 12 : 1} required /></label>{error && <p role="alert" className="mt-4 text-sm text-[#f6ad65]">{error}</p>}<button className="button button-primary mt-7 w-full" disabled={loading}>{loading ? "Working…" : signingUp ? "Create account" : "Sign in"}</button><p className="mt-5 text-center text-sm text-[#9cb7b5]">{signingUp ? "Already have an account?" : "New to Credora?"} <Link className="text-[#61e6cf]" href={signingUp ? "/login" : "/signup"}>{signingUp ? "Sign in" : "Create one"}</Link></p><div className="mt-6"><Disclaimer compact /></div></form></div>;
}
