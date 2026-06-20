"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Sparkles, GitCompareArrows, RefreshCw } from "lucide-react";
import { apiFetch } from "../../../../lib/api";
import { Disclaimer } from "../../../../components/site-chrome";
import { RiskGauge } from "../../../../components/risk-gauge";
import { FactorWaterfall } from "../../../../components/factor-waterfall";

type MemoStatus = "idle" | "queued" | "processing" | "completed" | "failed";
type Analysis = { _id: string; input: Record<string, unknown>; derived: { dtiBeforeLoan: number; dtiAfterLoan: number; estimatedMonthlyPayment: number }; result: { approvalProbability: number; riskScore: number; riskBand: string; simulatedDecision: string; suggestedAprMin: number; suggestedAprMax: number; affordabilityGrade: string }; explanation: { modelVersion: string; positiveFactors: { label: string; impact: number }[]; negativeFactors: { label: string; impact: number }[]; warnings: string[] }; aiMemo?: string; aiMemoStatus?: MemoStatus; aiMemoProvider?: string; aiMemoUsedFallback?: boolean; aiMemoError?: { message: string } };
type Candidate = { id: string; title: string; tradeoff: string; approvalProbabilityDelta: number };

export function ResultClient({ id }: { id: string }) {
  const [analysis, setAnalysis] = useState<Analysis>();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [status, setStatus] = useState<string>();
  const [error, setError] = useState<string>();

  const load = useCallback(async (loadCandidates = false) => {
    const response = await apiFetch<{ analysis: Analysis }>(`/api/risk/analyses/${id}`);
    setAnalysis(response.analysis);
    if (loadCandidates) {
      const autopilot = await apiFetch<{ candidates: Candidate[] }>("/api/risk/autopilot", { method: "POST", body: JSON.stringify(response.analysis.input) });
      setCandidates(autopilot.candidates.slice(0, 3));
    }
  }, [id]);

  useEffect(() => { load(true).catch((cause) => setError(cause instanceof Error ? cause.message : "Unable to load this result.")); }, [load]);
  useEffect(() => {
    if (!analysis || !["queued", "processing"].includes(analysis.aiMemoStatus ?? "idle")) return;
    const timer = window.setInterval(() => { load().catch(() => undefined); }, 2500);
    return () => window.clearInterval(timer);
  }, [analysis, load]);

  async function action(kind: "report" | "memo" | "scenario") {
    setStatus("Working...");
    try {
      if (kind === "report") await apiFetch("/api/reports", { method: "POST", body: JSON.stringify({ analysisId: id, title: "Credora simulation report" }) });
      if (kind === "memo") {
        const memo = await apiFetch<{ status: MemoStatus }>("/api/ai/underwriting-memo", { method: "POST", body: JSON.stringify({ analysisId: id, regenerate: analysis?.aiMemoStatus === "completed" }) });
        setAnalysis((current) => current ? { ...current, aiMemoStatus: memo.status } : current);
      }
      if (kind === "scenario" && analysis) await apiFetch("/api/scenarios", { method: "POST", body: JSON.stringify({ name: "Saved result scenario", baseAnalysisId: id, inputs: analysis.input }) });
      setStatus(kind === "memo" ? "Memo job queued. This page will update when it is ready." : kind === "report" ? "Report job queued." : "Scenario saved.");
    } catch (cause) { setStatus(cause instanceof Error ? cause.message : "Action failed."); }
  }

  if (error) return <div className="mx-auto max-w-3xl px-5 py-16"><p role="alert" className="text-[#f6ad65]">{error}</p><Link className="button button-secondary mt-6" href="/analyzer">Return to analyzer</Link></div>;
  if (!analysis) return <div className="mx-auto grid min-h-80 place-items-center"><RefreshCw className="h-6 w-6 animate-spin text-[#61e6cf]"/></div>;
  const factors = [...analysis.explanation.positiveFactors, ...analysis.explanation.negativeFactors];
  const memoStatus = analysis.aiMemoStatus ?? "idle";
  const memoPending = memoStatus === "queued" || memoStatus === "processing";

  return <div className="mx-auto max-w-6xl px-5 py-12"><div className="flex flex-wrap items-start justify-between gap-5"><div><p className="text-sm font-medium text-[#61e6cf]">Saved simulation</p><h1 className="mt-2 text-4xl font-semibold">Risk result, explained.</h1><p className="mt-3 text-sm text-[#9cb7b5]">Scoring model {analysis.explanation.modelVersion} · High-confidence deterministic simulation</p></div><div className="flex flex-wrap gap-2"><button onClick={() => action("scenario")} className="button button-secondary text-sm"><GitCompareArrows className="h-4 w-4"/>Save scenario</button><button onClick={() => action("memo")} disabled={memoPending} className="button button-secondary text-sm">{memoPending ? <><RefreshCw className="h-4 w-4 animate-spin"/>Generating memo</> : <><Sparkles className="h-4 w-4"/>{memoStatus === "completed" ? "Regenerate memo" : "Queue memo"}</>}</button><button onClick={() => action("report")} className="button button-primary text-sm"><FileText className="h-4 w-4"/>Generate report</button></div></div>{status && <p className="mt-4 text-sm text-[#61e6cf]">{status}</p>}<div className="mt-8 grid gap-5 lg:grid-cols-[.8fr_1.2fr]"><section className="glass rounded-3xl p-6"><div className="flex flex-wrap items-center gap-6"><RiskGauge value={Math.round(analysis.result.riskScore)} label={analysis.result.riskBand.replace("_", " ")}/><div><p className="text-sm text-[#9cb7b5]">Approval signal</p><p className="mt-2 text-5xl font-semibold text-[#61e6cf]">{Math.round(analysis.result.approvalProbability * 100)}%</p><p className="mt-2 text-sm uppercase tracking-[.14em] text-[#f6ad65]">{analysis.result.simulatedDecision.replaceAll("_", " ")}</p></div></div><div className="mt-7 grid grid-cols-2 gap-3 text-sm"><div className="rounded-xl border border-[#b9eae11c] p-3"><p className="text-[#9cb7b5]">Estimated APR</p><p className="mt-1 font-semibold">{analysis.result.suggestedAprMin}–{analysis.result.suggestedAprMax}%</p></div><div className="rounded-xl border border-[#b9eae11c] p-3"><p className="text-[#9cb7b5]">Monthly payment</p><p className="mt-1 font-semibold">${analysis.derived.estimatedMonthlyPayment.toLocaleString()}</p></div><div className="rounded-xl border border-[#b9eae11c] p-3"><p className="text-[#9cb7b5]">DTI before / after</p><p className="mt-1 font-semibold">{(analysis.derived.dtiBeforeLoan * 100).toFixed(1)}% → {(analysis.derived.dtiAfterLoan * 100).toFixed(1)}%</p></div><div className="rounded-xl border border-[#b9eae11c] p-3"><p className="text-[#9cb7b5]">Affordability</p><p className="mt-1 font-semibold">{analysis.result.affordabilityGrade}</p></div></div></section><section className="glass rounded-3xl p-6"><h2 className="font-semibold">Risk-driver waterfall</h2><div className="mt-5"><FactorWaterfall factors={factors}/></div><h2 className="mt-8 font-semibold">Data-quality and risk warnings</h2><ul className="mt-3 space-y-2 text-sm text-[#b8d3cf]">{analysis.explanation.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul><div className="mt-8 rounded-2xl border border-[#b9eae11c] p-4"><div className="flex items-center justify-between gap-3"><h2 className="font-semibold">AI explanatory memo</h2><span className="text-xs uppercase tracking-[.12em] text-[#9cb7b5]">{memoStatus}</span></div>{memoPending && <p className="mt-3 flex items-center gap-2 text-sm text-[#b8d3cf]"><RefreshCw className="h-4 w-4 animate-spin text-[#61e6cf]"/>The queued narrative is being generated. This view refreshes automatically.</p>}{memoStatus === "failed" && <p role="alert" className="mt-3 text-sm text-[#f6ad65]">{analysis.aiMemoError?.message ?? "The memo could not be generated. You can retry it."}</p>}{memoStatus === "completed" && analysis.aiMemo && <><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#b8d3cf]">{analysis.aiMemo}</p><p className="mt-3 text-xs text-[#9cb7b5]">Provider: {analysis.aiMemoProvider ?? "mock"}{analysis.aiMemoUsedFallback ? " · deterministic fallback used" : ""}</p></>}{memoStatus === "idle" && <p className="mt-3 text-sm text-[#9cb7b5]">Queue a bounded narrative that explains this saved simulation. It never changes the score or makes a lending decision.</p>}</div></section></div><section className="glass mt-5 rounded-3xl p-6"><div className="flex items-center justify-between"><h2 className="font-semibold">What-if improvements</h2><Link href="/autopilot" className="text-sm text-[#61e6cf]">Open Autopilot →</Link></div><div className="mt-4 grid gap-3 md:grid-cols-3">{candidates.map((candidate) => <article className="rounded-xl border border-[#b9eae11c] p-4" key={candidate.id}><p className="font-medium">{candidate.title}</p><p className="mt-2 text-sm text-[#61e6cf]">{candidate.approvalProbabilityDelta >= 0 ? "+" : ""}{Math.round(candidate.approvalProbabilityDelta * 100)} points</p><p className="mt-2 text-xs text-[#9cb7b5]">{candidate.tradeoff}</p></article>)}</div></section><div className="mt-7"><Disclaimer /></div></div>;
}
