"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { apiFetch } from "../../lib/api";
import { Disclaimer } from "../../components/site-chrome";

type Profile = { _id: string; displayName: string; baselineFinancials: { creditScore: number; annualIncome: number; monthlyDebt: number; requestedLoanAmount: number; loanTermMonths: number; loanPurpose: string }; tags: string[]; notes?: string; updatedAt: string };
const initial = { annualIncome: "75000", creditScore: "700", monthlyDebt: "900", requestedLoanAmount: "15000", loanTermMonths: "36", loanPurpose: "debt consolidation" };

export function ProfilesClient() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [error, setError] = useState<string>();
  const [editing, setEditing] = useState<string>();
  const reload = () => apiFetch<{ profiles: Profile[] }>("/api/profiles").then(({ profiles }) => setProfiles(profiles)).catch((cause) => setError(cause instanceof Error ? cause.message : "Unable to load profiles."));
  useEffect(() => { reload(); }, []);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(undefined);
    const form = new FormData(event.currentTarget);
    const baselineFinancials = Object.fromEntries(Object.entries(initial).map(([key]) => [key, key === "loanPurpose" ? String(form.get(key)) : Number(form.get(key))]));
    try { await apiFetch("/api/profiles", { method: "POST", body: JSON.stringify({ displayName: String(form.get("displayName")), baselineFinancials, anonymized: true, tags: String(form.get("tags") ?? "baseline").split(",").map((tag) => tag.trim()).filter(Boolean) }) }); event.currentTarget.reset(); reload(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save profile."); }
  }
  async function rename(profile: Profile) { const displayName = window.prompt("Profile name", profile.displayName); if (!displayName?.trim()) return; try { await apiFetch(`/api/profiles/${profile._id}`, { method: "PATCH", body: JSON.stringify({ displayName: displayName.trim() }) }); reload(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to rename profile."); } }
  async function remove(id: string) { if (!window.confirm("Delete this saved profile?")) return; try { await apiFetch(`/api/profiles/${id}`, { method: "DELETE" }); reload(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to delete profile."); } }

  return <div className="mx-auto max-w-6xl px-5 py-12"><p className="text-sm font-medium text-[#61e6cf]">Borrower profiles</p><h1 className="mt-2 text-4xl font-semibold">Privacy-safe baselines for comparison.</h1><p className="mt-3 max-w-2xl text-[#b8d3cf]">Save only permitted financial simulation inputs. Names are labels, never real borrower identity records.</p><form className="glass mt-7 grid gap-3 rounded-2xl p-5 sm:grid-cols-2 lg:grid-cols-4" onSubmit={create}><input className="input" name="displayName" placeholder="Anonymized profile name" required/><input className="input" name="tags" placeholder="Tags, comma separated" defaultValue="baseline"/>{Object.entries(initial).map(([name, value]) => name === "loanPurpose" ? <select className="input" name={name} defaultValue={value} key={name}><option>debt consolidation</option><option>home improvement</option><option>education</option><option>major purchase</option><option>other</option></select> : <input className="input" name={name} type="number" min={name === "creditScore" ? 300 : 0} defaultValue={value} required key={name}/>) }<button className="button button-primary sm:col-span-2 lg:col-span-4"><Plus className="h-4 w-4"/>Save private baseline</button></form>{error && <p role="alert" className="mt-4 text-sm text-[#f6ad65]">{error}</p>}<div className="mt-7 grid gap-4 md:grid-cols-2">{profiles.map((profile) => <article className="glass rounded-2xl p-5" key={profile._id}><div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold">{profile.displayName}</h2><p className="mt-1 text-xs text-[#9cb7b5]">{profile.tags.join(" · ") || "untagged"}</p></div><div className="flex gap-1"><button aria-label={`Rename ${profile.displayName}`} className="button button-secondary p-2" onClick={() => rename(profile)}><Pencil className="h-4 w-4"/></button><button aria-label={`Delete ${profile.displayName}`} className="button button-secondary p-2" onClick={() => remove(profile._id)}><Trash2 className="h-4 w-4"/></button></div></div><div className="mt-5 grid grid-cols-2 gap-3 text-sm"><p className="rounded-xl border border-[#b9eae11c] p-3"><span className="block text-xs text-[#9cb7b5]">Credit score</span>{profile.baselineFinancials.creditScore}</p><p className="rounded-xl border border-[#b9eae11c] p-3"><span className="block text-xs text-[#9cb7b5]">Annual income</span>${profile.baselineFinancials.annualIncome.toLocaleString()}</p><p className="rounded-xl border border-[#b9eae11c] p-3"><span className="block text-xs text-[#9cb7b5]">Monthly debt</span>${profile.baselineFinancials.monthlyDebt.toLocaleString()}</p><p className="rounded-xl border border-[#b9eae11c] p-3"><span className="block text-xs text-[#9cb7b5]">Requested loan</span>${profile.baselineFinancials.requestedLoanAmount.toLocaleString()}</p></div><Link className="mt-5 inline-block text-sm text-[#61e6cf]" href="/analyzer">Model a related scenario →</Link></article>)}{!profiles.length && <p className="col-span-full rounded-2xl border border-dashed border-[#b9eae11c] p-8 text-center text-sm text-[#9cb7b5]">Save your first anonymized baseline to start comparing scenarios.</p>}</div><div className="mt-8"><Disclaimer/></div></div>;
}
