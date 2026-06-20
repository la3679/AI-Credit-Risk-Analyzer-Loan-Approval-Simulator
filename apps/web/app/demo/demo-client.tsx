"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";
import { apiFetch } from "../../lib/api";
import { Disclaimer } from "../../components/site-chrome";
export function DemoClient() {
  const [error, setError] = useState<string>(); const [loading, setLoading] = useState(false); const router = useRouter();
  async function startDemo() { setLoading(true); setError(undefined); try { await apiFetch("/api/demo/session", { method: "POST" }); router.push("/analyzer"); } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to begin demo."); } finally { setLoading(false); } }
  return <div className="mx-auto max-w-xl px-5 py-20"><div className="glass rounded-3xl p-7"><p className="text-sm font-medium text-[#61e6cf]">Demo workspace</p><h1 className="mt-3 text-3xl font-semibold">Try Credora without an account.</h1><p className="mt-4 leading-7 text-[#b8d3cf]">A temporary guest workspace is created for 24 hours and then cleaned up automatically.</p><button className="button button-primary mt-7" onClick={startDemo} disabled={loading}>{loading ? "Creating workspace…" : <><Play className="h-4 w-4" /> Start demo</>}</button>{error && <p role="alert" className="mt-4 text-sm text-[#f6ad65]">{error}</p>}<div className="mt-7"><Disclaimer /></div></div></div>;
}
