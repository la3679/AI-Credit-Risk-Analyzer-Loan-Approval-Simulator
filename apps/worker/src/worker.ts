import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { Worker } from "bullmq";
import PDFDocument from "pdfkit";
import pino from "pino";
import { SIMULATOR_DISCLAIMER } from "@credora/shared";
import { getAIProvider, getMockProvider } from "./ai-providers";
import { connectDatabase } from "../../api/src/db";
import { env } from "../../api/src/config";
import { getQueues, getRedis, QUEUES } from "../../api/src/queues";
import { AIPromptTemplate, BorrowerProfile, FeatureFlag, ImprovementPlan, LoanScenario, PortfolioSnapshot, Report, RiskAnalysis, User } from "../../api/src/models";
import { reportStorageDir } from "../../api/src/storage";

const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });
const storageDir = reportStorageDir;

function writePdf(reportId: string, title: string, analysis: { input: Record<string, unknown>; result: Record<string, unknown>; derived: Record<string, unknown>; explanation: Record<string, unknown> }) {
  fs.mkdirSync(storageDir, { recursive: true });
  const fileName = `${reportId}.pdf`;
  const output = path.join(storageDir, fileName);
  return new Promise<string>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48 });
    const stream = fs.createWriteStream(output);
    doc.pipe(stream);
    doc.fontSize(24).fillColor("#0f2f3a").text("Credora AI", { continued: true }).fillColor("#0f172a").text(" - Simulation Report");
    doc.moveDown(.35).fontSize(16).fillColor("#0f172a").text(title);
    doc.moveDown(.4).fontSize(9).fillColor("#0f766e").text(`MODEL VERSION: ${String((analysis.explanation as any).modelVersion ?? "versioned simulator")}`);
    doc.moveDown(.7).fontSize(11).fillColor("#334155").text(SIMULATOR_DISCLAIMER);
    doc.moveDown().fillColor("#0f172a").fontSize(14).text("Simulation summary");
    const summary = [["Risk score", (analysis.result as any).riskScore], ["Simulated approval signal", `${Math.round(Number((analysis.result as any).approvalProbability ?? 0) * 100)}%`], ["Estimated monthly payment", `$${Number((analysis.derived as any).estimatedMonthlyPayment ?? 0).toFixed(0)}`], ["Projected DTI", `${(Number((analysis.derived as any).dtiAfterLoan ?? 0) * 100).toFixed(1)}%`]];
    summary.forEach(([label, value]) => doc.fontSize(10).fillColor("#334155").text(`${label}: `, { continued: true }).fillColor("#0f172a").text(String(value)));
    doc.moveDown().fontSize(14).fillColor("#0f172a").text("Simulation inputs");
    Object.entries(analysis.input).forEach(([key, value]) => doc.fontSize(9).fillColor("#334155").text(`${key}: ${String(value)}`));
    const warnings = (analysis.explanation as any).warnings as string[] | undefined;
    if (warnings?.length) { doc.moveDown().fontSize(14).fillColor("#0f172a").text("Data and risk warnings"); warnings.forEach((warning) => doc.fontSize(9).fillColor("#92400e").text(`- ${warning}`)); }
    doc.moveDown().fontSize(9).fillColor("#64748b").text("Generated for a portfolio demonstration. This report is not a credit report, lending decision, or regulatory underwriting document.");
    doc.end();
    stream.on("finish", () => resolve(`/api/reports/${reportId}/download`));
    stream.on("error", reject);
  });
}

async function generateMemo(analysis: { result: any; derived: any; explanation: any }) {
  const openAiFlag: any = await FeatureFlag.findOne({ key: "enable_openai_provider" }).lean();
  const openAiEnabled = openAiFlag?.enabled;
  const selected = env.AI_PROVIDER;
  const template: any = await AIPromptTemplate.findOne({ key: "underwriting-memo", active: true }).sort({ version: -1 }).lean();
  const input = { result: analysis.result, derived: analysis.derived, factors: analysis.explanation };
  if (selected === "openai" && !openAiEnabled) return { memo: await getMockProvider().generateUnderwritingMemo(input, { promptTemplate: template?.content }), provider: "mock", usedFallback: true };
  try {
    const provider = getAIProvider();
    return { memo: await provider.generateUnderwritingMemo(input, { promptTemplate: template?.content }), provider: provider.name, usedFallback: false };
  } catch (error) {
    logger.warn({ provider: selected, err: error }, "AI provider failed; using deterministic mock fallback");
    return { memo: await getMockProvider().generateUnderwritingMemo(input, { promptTemplate: template?.content }), provider: "mock", usedFallback: true };
  }
}

async function cleanupDemoData() {
  const now = new Date();
  await Report.updateMany({ status: "completed", expiresAt: { $lt: now } }, { status: "expired" });
  const expiredReports = await Report.find({ status: "expired", expiresAt: { $lt: new Date(now.getTime() - 7 * 86_400_000) } });
  for (const report of expiredReports) {
    fs.rmSync(path.join(storageDir, `${report._id}.pdf`), { force: true });
    await Report.updateOne({ _id: report._id, ownerId: report.ownerId }, { status: "deleted", deletedAt: now, pdfUrl: undefined });
  }
  const guests = await User.find({ isGuest: true, expiresAt: { $lt: now } }).select("_id").lean();
  const ownerIds = guests.map((guest) => guest._id);
  if (!ownerIds.length) return { guests: 0 };
  await Promise.all([
    RiskAnalysis.deleteMany({ ownerId: { $in: ownerIds } }),
    BorrowerProfile.deleteMany({ ownerId: { $in: ownerIds } }),
    LoanScenario.deleteMany({ ownerId: { $in: ownerIds } }),
    ImprovementPlan.deleteMany({ ownerId: { $in: ownerIds } }),
    Report.deleteMany({ ownerId: { $in: ownerIds } }),
    User.deleteMany({ _id: { $in: ownerIds }, isGuest: true }),
  ]);
  return { guests: ownerIds.length };
}

async function start() {
  await connectDatabase();
  const connection = { url: env.REDIS_URL };
  new Worker(QUEUES.reports, async (job) => {
    const { reportId, ownerId } = job.data as { reportId: string; ownerId: string };
    const report = await Report.findOne({ _id: reportId, ownerId });
    if (!report) return;
    await Report.updateOne({ _id: report._id, ownerId }, { status: "processing", error: undefined });
    try {
      const analysis = await RiskAnalysis.findOne({ _id: report.analysisId, ownerId }).lean();
      if (!analysis) throw new Error("Analysis no longer exists.");
      const pdfUrl = await writePdf(String(report._id), report.title, analysis as any);
      await Report.updateOne({ _id: report._id, ownerId }, { status: "completed", pdfUrl });
    } catch (error) {
      await Report.updateOne({ _id: report._id, ownerId }, { status: "failed", error: { code: "PDF_GENERATION_FAILED", message: error instanceof Error ? error.message : "Unknown error" } });
      throw error;
    }
  }, { connection, concurrency: 2 }).on("failed", (job, error) => logger.error({ jobId: job?.id, err: error }, "Report job failed"));

  new Worker(QUEUES.ai, async (job) => {
    const { analysisId, ownerId } = job.data as { analysisId: string; ownerId: string };
    const analysis = await RiskAnalysis.findOne({ _id: analysisId, ownerId });
    if (!analysis) return;
    await RiskAnalysis.updateOne({ _id: analysis._id, ownerId }, { aiMemoStatus: "processing", aiMemoError: undefined });
    try {
      const generated = await generateMemo(analysis as any);
      await RiskAnalysis.updateOne({ _id: analysis._id, ownerId }, { aiMemo: generated.memo, aiMemoStatus: "completed", aiMemoProvider: generated.provider, aiMemoUsedFallback: generated.usedFallback, aiMemoGeneratedAt: new Date(), aiMemoError: undefined });
      logger.info({ jobId: job.id, analysisId, ownerId, provider: generated.provider, usedFallback: generated.usedFallback }, "AI memo completed");
    } catch (error) {
      await RiskAnalysis.updateOne({ _id: analysis._id, ownerId }, { aiMemoStatus: "failed", aiMemoError: { code: "AI_MEMO_FAILED", message: error instanceof Error ? error.message : "Unknown error" } });
      throw error;
    }
  }, { connection, concurrency: 3 }).on("failed", (job, error) => logger.error({ jobId: job?.id, err: error }, "AI job failed"));

  new Worker(QUEUES.portfolio, async (job) => {
    const { ownerId } = job.data as { ownerId: string };
    const analyses = await RiskAnalysis.find({ ownerId }).lean();
    const summary = { analyses: analyses.length, averageRiskScore: analyses.length ? analyses.reduce((sum, analysis: any) => sum + analysis.result.riskScore, 0) / analyses.length : 0 };
    await PortfolioSnapshot.create({ ownerId, summary });
  }, { connection }).on("failed", (job, error) => logger.error({ jobId: job?.id, err: error }, "Portfolio job failed"));

  new Worker(QUEUES.maintenance, async () => cleanupDemoData(), { connection }).on("failed", (job, error) => logger.error({ jobId: job?.id, err: error }, "Maintenance job failed"));
  await getQueues().maintenance.add("demo-cleanup", {}, { repeat: { every: 60 * 60 * 1_000 }, jobId: "demo-cleanup" });
  logger.info("Credora worker is processing queues");
}

start().catch((error) => { logger.fatal({ err: error }, "Worker failed to start"); process.exit(1); });
