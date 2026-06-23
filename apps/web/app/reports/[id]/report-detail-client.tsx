"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, FileText, RefreshCw } from "lucide-react";
import { apiFetch } from "../../../lib/api";
import { Disclaimer } from "../../../components/site-chrome";

type Report = { _id: string; title: string; type: string; status: "queued" | "processing" | "completed" | "failed" | "expired" | "deleted"; modelVersion?: string; analysisId?: string; createdAt: string; error?: { message: string } };

export function ReportDetailClient({ id }: { id: string }) {
  const [report, setReport] = useState<Report>(); const [error, setError] = useState<string>();
  const load = () => apiFetch<{ report: Report }>(`/api/reports/${id}`).then(({ report }) => setReport(report)).catch((cause) => setError(cause instanceof Error ? cause.message : "Unable to load report."));
  useEffect(() => { load(); }, [id]);
  useEffect(() => { if (!report || !["queued", "processing"].includes(report.status)) return; const timer = window.setInterval(load, 2500); return () => window.clearInterval(timer); }, [report]);
  if (error) return <div className="mx-auto max-w-3xl px-5 py-16"><p role="alert" className="text-[#f6ad65]">{error}</p><Link href="/reports" className="button button-secondary mt-6">Return to reports</Link></div>;
  if (!report) return <div className="mx-auto grid min-h-80 place-items-center"><RefreshCw className="h-6 w-6 animate-spin text-[#61e6cf]"/></div>;
  const active = report.status === "queued" || report.status === "processing";
  return <div className="mx-auto max-w-4xl px-5 py-12"><Link className="text-sm text-[#61e6cf]" href="/reports">← Report history</Link><section className="glass mt-5 rounded-3xl p-7"><div className="flex flex-wrap items-start justify-between gap-5"><div><p className="text-sm font-medium text-[#61e6cf]">Report preview</p><h1 className="mt-2 text-3xl font-semibold">{report.title}</h1><p className="mt-3 text-sm text-[#9cb7b5]">{report.type.replace("_", " ")} · created {new Date(report.createdAt).toLocaleString()}</p></div><span className="rounded-full border border-[#b9eae11c] px-3 py-1 text-xs uppercase tracking-[.14em] text-[#b8d3cf]">{report.status}</span></div><div className="mt-8 grid gap-4 sm:grid-cols-2"><div className="rounded-2xl border border-[#b9eae11c] p-4"><p className="text-xs text-[#9cb7b5]">Risk model</p><p className="mt-2 font-semibold">{report.modelVersion ?? "Versioned simulator"}</p></div><div className="rounded-2xl border border-[#b9eae11c] p-4"><p className="text-xs text-[#9cb7b5]">Report policy</p><p className="mt-2 font-semibold">Educational simulation only</p></div></div>{active && <p className="mt-7 flex items-center gap-2 text-sm text-[#b8d3cf]"><RefreshCw className="h-4 w-4 animate-spin text-[#61e6cf]"/>The report worker is preparing this export. This preview refreshes automatically.</p>}{report.status === "completed" && <div className="mt-7 rounded-2xl border border-[#61e6cf55] bg-[#61e6cf0a] p-5"><p className="font-medium">Your educational simulation report is ready.</p><a className="button button-primary mt-4" href={`/api/reports/${report._id}/download`}><Download className="h-4 w-4"/>Download PDF</a></div>}{report.status === "failed" && <p role="alert" className="mt-7 text-sm text-[#f6ad65]">{report.error?.message ?? "The report could not be generated."}</p>}</section><section className="glass mt-5 rounded-3xl p-6"><FileText className="h-5 w-5 text-[#61e6cf]"/><h2 className="mt-4 text-xl font-semibold">Included in the PDF</h2><p className="mt-3 text-sm leading-6 text-[#b8d3cf]">Versioned simulation summary, permitted financial inputs, projected payment and debt-to-income metrics, data warnings, and the Credora simulator disclaimer.</p></section><div className="mt-7"><Disclaimer/></div></div>;
}
