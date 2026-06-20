import { Router } from "express";
import argon2 from "argon2";
import crypto from "node:crypto";
import mongoose from "mongoose";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { calculateRisk, DEFAULT_RISK_MODEL, featureFlagKeys, financialInputSchema, generateWhatIfAutopilot, loginSchema, riskModelConfigSchema, signupSchema } from "@credora/shared";
import { AIPromptTemplate, AuditLog, BorrowerProfile, FeatureFlag, ImprovementPlan, LoanScenario, PortfolioSnapshot, Report, RiskAnalysis, RiskModel, Session, User } from "./models";
import { clearSessionCookies, issueSession, requireAdmin, requireAuth, rotateSession } from "./auth";
import { ApiError } from "./errors";
import { getFeatureFlags, requireFlag } from "./flags";
import { getQueues } from "./queues";

const router = Router();
const safeUser = (user: { _id: unknown; name: string; email: string; role: string; isGuest?: boolean }) => ({ id: String(user._id), name: user.name, email: user.email, role: user.role, isGuest: Boolean(user.isGuest) });
const audit = (requestId: string, actorId: string, action: string, metadata?: object) => AuditLog.create({ ownerId: actorId, actorId, action, metadata, requestId });

router.post("/api/auth/signup", async (req, res, next) => {
  try {
    const input = signupSchema.parse(req.body);
    const exists = await User.exists({ email: input.email });
    if (exists) throw new ApiError(409, "EMAIL_IN_USE", "An account already uses that email address.");
    const user = await User.create({ name: input.name, email: input.email, passwordHash: await argon2.hash(input.password, { type: argon2.argon2id }), role: "user" });
    await issueSession(res, user, req);
    await audit(req.requestId, String(user._id), "auth.signup");
    res.status(201).json({ user: safeUser(user), csrfToken: res.getHeader("set-cookie") ? undefined : undefined });
  } catch (error) { next(error); }
});

router.post("/api/auth/login", async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const user = await User.findOne({ email: input.email, isGuest: { $ne: true } });
    if (!user || !(await argon2.verify(user.passwordHash, input.password))) throw new ApiError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
    if (user.disabledAt) throw new ApiError(403, "ACCOUNT_DISABLED", "This account has been disabled.");
    await issueSession(res, user, req);
    await audit(req.requestId, String(user._id), "auth.login");
    res.json({ user: safeUser(user) });
  } catch (error) { next(error); }
});

router.post("/api/auth/refresh", async (req, res, next) => {
  try { await rotateSession(req, res); res.status(204).end(); } catch (error) { next(error); }
});

router.post("/api/auth/logout", requireAuth, async (req, res, next) => {
  try {
    await Session.updateOne({ _id: req.auth!.sessionId, ownerId: req.auth!.userId }, { revokedAt: new Date() });
    clearSessionCookies(res);
    await audit(req.requestId, req.auth!.userId, "auth.logout");
    res.status(204).end();
  } catch (error) { next(error); }
});

router.get("/api/auth/me", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.auth!.userId });
    if (!user) throw new ApiError(401, "UNAUTHENTICATED", "Sign in is required.");
    res.json({ user: safeUser(user) });
  } catch (error) { next(error); }
});

router.post("/api/demo/session", async (req, res, next) => {
  try {
    await requireFlag("enable_demo_mode");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1_000);
    const user = await User.create({ name: "Demo explorer", email: `guest-${crypto.randomUUID()}@demo.credora.local`, passwordHash: await argon2.hash(crypto.randomUUID()), role: "guest", isGuest: true, expiresAt });
    await issueSession(res, user, req);
    await audit(req.requestId, String(user._id), "demo.session_created", { expiresAt });
    res.status(201).json({ user: safeUser(user), expiresAt });
  } catch (error) { next(error); }
});

router.get("/api/feature-flags", async (_req, res, next) => {
  try { res.json({ flags: await getFeatureFlags() }); } catch (error) { next(error); }
});

router.patch("/api/admin/feature-flags/:key", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const key = z.enum(featureFlagKeys).parse(req.params.key);
    const body = z.object({ enabled: z.boolean() }).parse(req.body);
    const flag = await FeatureFlag.findOneAndUpdate({ key }, { enabled: body.enabled, updatedBy: req.auth!.userId }, { upsert: true, new: true });
    await audit(req.requestId, req.auth!.userId, "feature_flag.updated", { key, enabled: body.enabled });
    res.json({ flag });
  } catch (error) { next(error); }
});

router.post("/api/risk/analyze", requireAuth, async (req, res, next) => {
  try {
    const input = financialInputSchema.parse(req.body);
    const active: any = await RiskModel.findOne({ active: true }).sort({ updatedAt: -1 }).lean();
    const analysis = calculateRisk(input, active ? riskModelConfigSchema.parse(active.config) : DEFAULT_RISK_MODEL);
    const saved = await RiskAnalysis.create({ ownerId: req.auth!.userId, input, ...analysis });
    await audit(req.requestId, req.auth!.userId, "risk.analysis_created", { analysisId: String(saved._id) });
    res.status(201).json({ id: String(saved._id), ...analysis });
  } catch (error) { next(error); }
});
router.post("/api/risk/autopilot", requireAuth, async (req, res, next) => {
  try {
    const input = financialInputSchema.parse(req.body);
    const active: any = await RiskModel.findOne({ active: true }).sort({ updatedAt: -1 }).lean();
    const candidates = generateWhatIfAutopilot(input, active ? riskModelConfigSchema.parse(active.config) : DEFAULT_RISK_MODEL);
    res.json({ candidates, disclaimer: "Improvement paths are educational simulations, not financial advice or lending recommendations." });
  } catch (error) { next(error); }
});

router.get("/api/risk/analyses", requireAuth, async (req, res, next) => {
  try { res.json({ analyses: await RiskAnalysis.find({ ownerId: req.auth!.userId }).sort({ createdAt: -1 }).limit(100).lean() }); } catch (error) { next(error); }
});
router.get("/api/risk/analyses/:id", requireAuth, async (req, res, next) => {
  try {
    const analysis = await RiskAnalysis.findOne({ _id: req.params.id, ownerId: req.auth!.userId }).lean();
    if (!analysis) throw new ApiError(404, "NOT_FOUND", "Analysis was not found.");
    res.json({ analysis });
  } catch (error) { next(error); }
});

router.post("/api/loans/simulate", requireAuth, async (req, res, next) => {
  try { const input = financialInputSchema.parse(req.body); res.json(calculateRisk(input)); } catch (error) { next(error); }
});
router.post("/api/loans/payment-estimate", requireAuth, async (req, res, next) => {
  try { const input = financialInputSchema.pick({ requestedLoanAmount: true, loanTermMonths: true }).extend({ annualRate: z.number().min(0).max(36) }).parse(req.body); const { calculateMonthlyPayment } = await import("@credora/shared"); res.json({ estimatedMonthlyPayment: calculateMonthlyPayment(input.requestedLoanAmount, input.annualRate, input.loanTermMonths) }); } catch (error) { next(error); }
});
router.post("/api/loans/apr-estimate", requireAuth, async (req, res, next) => {
  try { const input = financialInputSchema.parse(req.body); const result = calculateRisk(input); res.json({ suggestedAprMin: result.result.suggestedAprMin, suggestedAprMax: result.result.suggestedAprMax, disclaimer: "Educational/demo estimate only; not a lender quote." }); } catch (error) { next(error); }
});

router.get("/api/profiles", requireAuth, async (req, res, next) => {
  try { res.json({ profiles: await BorrowerProfile.find({ ownerId: req.auth!.userId }).sort({ updatedAt: -1 }).lean() }); } catch (error) { next(error); }
});
router.post("/api/profiles", requireAuth, async (req, res, next) => {
  try {
    const input = z.object({ displayName: z.string().min(1).max(100), anonymized: z.boolean().default(true), baselineFinancials: financialInputSchema, notes: z.string().max(2_000).optional(), tags: z.array(z.string().max(32)).max(10).default([]) }).parse(req.body);
    const profile = await BorrowerProfile.create({ ownerId: req.auth!.userId, ...input });
    res.status(201).json({ profile });
  } catch (error) { next(error); }
});
router.patch("/api/profiles/:id", requireAuth, async (req, res, next) => {
  try {
    const input = z.object({ displayName: z.string().min(1).max(100).optional(), notes: z.string().max(2_000).optional(), tags: z.array(z.string().max(32)).max(10).optional() }).parse(req.body);
    const profile = await BorrowerProfile.findOneAndUpdate({ _id: req.params.id, ownerId: req.auth!.userId }, input, { new: true });
    if (!profile) throw new ApiError(404, "NOT_FOUND", "Profile was not found.");
    res.json({ profile });
  } catch (error) { next(error); }
});
router.delete("/api/profiles/:id", requireAuth, async (req, res, next) => {
  try {
    const result = await BorrowerProfile.deleteOne({ _id: req.params.id, ownerId: req.auth!.userId });
    if (!result.deletedCount) throw new ApiError(404, "NOT_FOUND", "Profile was not found.");
    res.status(204).end();
  } catch (error) { next(error); }
});

router.get("/api/scenarios", requireAuth, async (req, res, next) => {
  try { res.json({ scenarios: await LoanScenario.find({ ownerId: req.auth!.userId }).sort({ updatedAt: -1 }).lean() }); } catch (error) { next(error); }
});
router.post("/api/scenarios", requireAuth, async (req, res, next) => {
  try {
    const body = z.object({ name: z.string().min(2).max(100), baseAnalysisId: z.string().optional(), inputs: financialInputSchema }).parse(req.body);
    const resultSnapshot = calculateRisk(body.inputs);
    const scenario = await LoanScenario.create({ ownerId: req.auth!.userId, ...body, resultSnapshot });
    res.status(201).json({ scenario });
  } catch (error) { next(error); }
});
router.get("/api/scenarios/:id", requireAuth, async (req, res, next) => {
  try { const scenario = await LoanScenario.findOne({ _id: req.params.id, ownerId: req.auth!.userId }).lean(); if (!scenario) throw new ApiError(404, "NOT_FOUND", "Scenario was not found."); res.json({ scenario }); } catch (error) { next(error); }
});
router.patch("/api/scenarios/:id", requireAuth, async (req, res, next) => {
  try {
    const body = z.object({ name: z.string().min(2).max(100).optional(), inputs: financialInputSchema.optional() }).parse(req.body);
    const update: Record<string, unknown> = { ...body };
    if (body.inputs) update.resultSnapshot = calculateRisk(body.inputs);
    const scenario = await LoanScenario.findOneAndUpdate({ _id: req.params.id, ownerId: req.auth!.userId }, update, { new: true });
    if (!scenario) throw new ApiError(404, "NOT_FOUND", "Scenario was not found.");
    res.json({ scenario });
  } catch (error) { next(error); }
});
router.delete("/api/scenarios/:id", requireAuth, async (req, res, next) => {
  try { const result = await LoanScenario.deleteOne({ _id: req.params.id, ownerId: req.auth!.userId }); if (!result.deletedCount) throw new ApiError(404, "NOT_FOUND", "Scenario was not found."); res.status(204).end(); } catch (error) { next(error); }
});
router.post("/api/scenarios/compare", requireAuth, async (req, res, next) => {
  try {
    const { ids } = z.object({ ids: z.array(z.string()).min(2).max(5) }).parse(req.body);
    const scenarios = await LoanScenario.find({ _id: { $in: ids }, ownerId: req.auth!.userId }).lean();
    if (scenarios.length !== ids.length) throw new ApiError(404, "NOT_FOUND", "One or more scenarios were not found.");
    res.json({ scenarios: scenarios.map((scenario: any) => ({ id: String(scenario._id), name: scenario.name, result: scenario.resultSnapshot?.result, derived: scenario.resultSnapshot?.derived })) });
  } catch (error) { next(error); }
});

router.get("/api/improvement-plans", requireAuth, async (req, res, next) => {
  try { res.json({ plans: await ImprovementPlan.find({ ownerId: req.auth!.userId }).sort({ updatedAt: -1 }).lean() }); } catch (error) { next(error); }
});
router.post("/api/improvement-plans", requireAuth, async (req, res, next) => {
  try {
    const body = z.object({ analysisId: z.string(), title: z.string().min(3).max(160), items: z.array(z.object({ title: z.string().min(2), description: z.string().min(2), priority: z.enum(["high", "medium", "low"]), estimatedImpact: z.number(), completed: z.boolean().default(false) })).min(1).max(12) }).parse(req.body);
    const analysis = await RiskAnalysis.findOne({ _id: body.analysisId, ownerId: req.auth!.userId });
    if (!analysis) throw new ApiError(404, "NOT_FOUND", "Analysis was not found.");
    const plan = await ImprovementPlan.create({ ownerId: req.auth!.userId, ...body });
    res.status(201).json({ plan });
  } catch (error) { next(error); }
});
router.get("/api/improvement-plans/:id", requireAuth, async (req, res, next) => {
  try { const plan = await ImprovementPlan.findOne({ _id: req.params.id, ownerId: req.auth!.userId }).lean(); if (!plan) throw new ApiError(404, "NOT_FOUND", "Improvement plan was not found."); res.json({ plan }); } catch (error) { next(error); }
});
router.patch("/api/improvement-plans/:id", requireAuth, async (req, res, next) => {
  try { const body = z.object({ title: z.string().min(3).max(160) }).parse(req.body); const plan = await ImprovementPlan.findOneAndUpdate({ _id: req.params.id, ownerId: req.auth!.userId }, body, { new: true }); if (!plan) throw new ApiError(404, "NOT_FOUND", "Improvement plan was not found."); res.json({ plan }); } catch (error) { next(error); }
});
router.patch("/api/improvement-plans/:id/items/:itemId", requireAuth, async (req, res, next) => {
  try { const body = z.object({ completed: z.boolean() }).parse(req.body); const plan = await ImprovementPlan.findOneAndUpdate({ _id: req.params.id, ownerId: req.auth!.userId, "items._id": req.params.itemId }, { $set: { "items.$.completed": body.completed } }, { new: true }); if (!plan) throw new ApiError(404, "NOT_FOUND", "Plan item was not found."); res.json({ plan }); } catch (error) { next(error); }
});

router.post("/api/reports", requireAuth, async (req, res, next) => {
  try {
    await requireFlag("enable_pdf_reports");
    const body = z.object({ analysisId: z.string(), title: z.string().min(3).max(160).default("Credit risk simulation report") }).parse(req.body);
    const analysis = await RiskAnalysis.findOne({ _id: body.analysisId, ownerId: req.auth!.userId });
    if (!analysis) throw new ApiError(404, "NOT_FOUND", "Analysis was not found.");
    const report = await Report.create({ ownerId: req.auth!.userId, analysisId: analysis._id, title: body.title, status: "queued", expiresAt: new Date(Date.now() + 30 * 86_400_000) });
    const job = await getQueues().reports.add("generate-pdf", { reportId: String(report._id), ownerId: req.auth!.userId });
    await Report.updateOne({ _id: report._id, ownerId: req.auth!.userId }, { jobId: String(job.id) });
    res.status(202).json({ report: { id: String(report._id), status: "queued", jobId: String(job.id) } });
  } catch (error) { next(error); }
});
router.get("/api/reports/:id", requireAuth, async (req, res, next) => {
  try {
    const report = await Report.findOne({ _id: req.params.id, ownerId: req.auth!.userId }).lean();
    if (!report) throw new ApiError(404, "NOT_FOUND", "Report was not found.");
    res.json({ report });
  } catch (error) { next(error); }
});
router.get("/api/reports", requireAuth, async (req, res, next) => {
  try { res.json({ reports: await Report.find({ ownerId: req.auth!.userId, status: { $ne: "deleted" } }).sort({ createdAt: -1 }).lean() }); } catch (error) { next(error); }
});
router.get("/api/reports/:id/download", requireAuth, async (req, res, next) => {
  try {
    const report: any = await Report.findOne({ _id: req.params.id, ownerId: req.auth!.userId, status: "completed" }).lean();
    if (!report) throw new ApiError(404, "NOT_FOUND", "Completed report was not found.");
    const reportPath = path.resolve(process.env.REPORT_STORAGE_DIR ?? "storage/reports", `${report._id}.pdf`);
    if (!fs.existsSync(reportPath)) throw new ApiError(404, "REPORT_FILE_MISSING", "The report file is no longer available.");
    res.download(reportPath, `${report.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`);
  } catch (error) { next(error); }
});
router.delete("/api/reports/:id", requireAuth, async (req, res, next) => {
  try { const report = await Report.findOneAndUpdate({ _id: req.params.id, ownerId: req.auth!.userId, status: { $ne: "deleted" } }, { status: "deleted", deletedAt: new Date(), pdfUrl: undefined }, { new: true }); if (!report) throw new ApiError(404, "NOT_FOUND", "Report was not found."); res.status(204).end(); } catch (error) { next(error); }
});

router.post("/api/ai/underwriting-memo", requireAuth, async (req, res, next) => {
  try {
    await requireFlag("enable_ai_memos");
    const body = z.object({ analysisId: z.string(), regenerate: z.boolean().optional().default(false) }).parse(req.body);
    const analysis = await RiskAnalysis.findOne({ _id: body.analysisId, ownerId: req.auth!.userId });
    if (!analysis) throw new ApiError(404, "NOT_FOUND", "Analysis was not found.");
    if (!body.regenerate && ["queued", "processing"].includes(analysis.aiMemoStatus ?? "idle")) {
      return res.status(202).json({ analysisId: String(analysis._id), jobId: analysis.aiMemoJobId, status: analysis.aiMemoStatus });
    }
    if (!body.regenerate && analysis.aiMemoStatus === "completed" && analysis.aiMemo) {
      return res.json({ analysisId: String(analysis._id), jobId: analysis.aiMemoJobId, status: "completed", memo: analysis.aiMemo });
    }
    const job = await getQueues().ai.add("underwriting-memo", { analysisId: String(analysis._id), ownerId: req.auth!.userId });
    await RiskAnalysis.updateOne({ _id: analysis._id, ownerId: req.auth!.userId }, { aiMemoStatus: "queued", aiMemoJobId: String(job.id), aiMemoError: undefined, aiMemoProvider: undefined, aiMemoUsedFallback: false });
    await audit(req.requestId, req.auth!.userId, "ai_memo.queued", { analysisId: String(analysis._id), jobId: String(job.id) });
    res.status(202).json({ analysisId: String(analysis._id), jobId: String(job.id), status: "queued" });
  } catch (error) { next(error); }
});
router.get("/api/ai/underwriting-memo/:analysisId", requireAuth, async (req, res, next) => {
  try {
    const analysis: any = await RiskAnalysis.findOne({ _id: req.params.analysisId, ownerId: req.auth!.userId }).select("aiMemo aiMemoStatus aiMemoJobId aiMemoProvider aiMemoUsedFallback aiMemoError aiMemoGeneratedAt").lean();
    if (!analysis) throw new ApiError(404, "NOT_FOUND", "Analysis was not found.");
    res.json({ memo: { content: analysis.aiMemo, status: analysis.aiMemoStatus ?? "idle", jobId: analysis.aiMemoJobId, provider: analysis.aiMemoProvider, usedFallback: Boolean(analysis.aiMemoUsedFallback), error: analysis.aiMemoError, generatedAt: analysis.aiMemoGeneratedAt } });
  } catch (error) { next(error); }
});
for (const task of ["borrower-explanation", "improvement-plan", "scenario-summary", "portfolio-insights"] as const) router.post(`/api/ai/${task}`, requireAuth, async (req, res, next) => {
  try { await requireFlag("enable_ai_memos"); const job = await getQueues().ai.add(task, { ownerId: req.auth!.userId, payload: z.object({ analysisId: z.string().optional() }).parse(req.body) }); res.status(202).json({ jobId: String(job.id), status: "queued" }); } catch (error) { next(error); }
});

router.get("/api/portfolio/summary", requireAuth, async (req, res, next) => {
  try {
    await requireFlag("enable_portfolio_analytics");
    const [summary] = await RiskAnalysis.aggregate([{ $match: { ownerId: new mongoose.Types.ObjectId(req.auth!.userId) } }, { $group: { _id: null, analyses: { $sum: 1 }, averageRiskScore: { $avg: "$result.riskScore" }, averageApprovalProbability: { $avg: "$result.approvalProbability" } } }]);
    res.json({ summary: summary ?? { analyses: 0, averageRiskScore: 0, averageApprovalProbability: 0 } });
  } catch (error) { next(error); }
});
router.get("/api/portfolio/risk-distribution", requireAuth, async (req, res, next) => {
  try { await requireFlag("enable_portfolio_analytics"); const distribution = await RiskAnalysis.aggregate([{ $match: { ownerId: new mongoose.Types.ObjectId(req.auth!.userId) } }, { $group: { _id: "$result.riskBand", count: { $sum: 1 } } }]); res.json({ distribution }); } catch (error) { next(error); }
});
router.get("/api/portfolio/alerts", requireAuth, async (req, res, next) => {
  try { await requireFlag("enable_portfolio_analytics"); const highRisk = await RiskAnalysis.countDocuments({ ownerId: req.auth!.userId, "result.riskBand": "high_risk" }); res.json({ alerts: highRisk ? [{ level: "warning", message: `${highRisk} saved simulations are in the high-risk band.` }] : [] }); } catch (error) { next(error); }
});
router.post("/api/portfolio/snapshot", requireAuth, async (req, res, next) => {
  try { await requireFlag("enable_portfolio_analytics"); const job = await getQueues().portfolio.add("portfolio-snapshot", { ownerId: req.auth!.userId }); res.status(202).json({ jobId: String(job.id), status: "queued" }); } catch (error) { next(error); }
});

router.get("/api/admin/overview", requireAuth, requireAdmin, async (_req, res, next) => {
  try { const [users, analyses, reports, jobs] = await Promise.all([User.countDocuments(), RiskAnalysis.countDocuments(), Report.countDocuments(), AuditLog.countDocuments()]); res.json({ users, analyses, reports, auditEvents: jobs }); } catch (error) { next(error); }
});
router.get("/api/admin/users", requireAuth, requireAdmin, async (_req, res, next) => {
  try { res.json({ users: await User.find({}).select("name email role isGuest createdAt disabledAt").sort({ createdAt: -1 }).lean() }); } catch (error) { next(error); }
});
router.patch("/api/admin/users/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try { const body = z.object({ role: z.enum(["user", "admin"]).optional(), disabledAt: z.coerce.date().nullable().optional() }).parse(req.body); const user = await User.findByIdAndUpdate(req.params.id, body, { new: true }); if (!user) throw new ApiError(404, "NOT_FOUND", "User was not found."); await audit(req.requestId, req.auth!.userId, "admin.user_updated", { targetId: req.params.id }); res.json({ user: safeUser(user) }); } catch (error) { next(error); }
});
router.get("/api/admin/risk-model-configs", requireAuth, requireAdmin, async (_req, res, next) => {
  try { res.json({ configs: await RiskModel.find({}).sort({ updatedAt: -1 }).lean() }); } catch (error) { next(error); }
});
router.post("/api/admin/risk-model-configs", requireAuth, requireAdmin, async (req, res, next) => {
  try { await requireFlag("enable_admin_model_editor"); const configInput = riskModelConfigSchema.parse(req.body.config); const config = await RiskModel.create({ version: configInput.version, config: configInput, active: false, ownerId: req.auth!.userId }); await audit(req.requestId, req.auth!.userId, "risk_model.created", { version: configInput.version }); res.status(201).json({ config }); } catch (error) { next(error); }
});
router.patch("/api/admin/risk-model-configs/:id/activate", requireAuth, requireAdmin, async (req, res, next) => {
  try { await requireFlag("enable_admin_model_editor"); const target = await RiskModel.findById(req.params.id); if (!target) throw new ApiError(404, "NOT_FOUND", "Model configuration was not found."); await RiskModel.updateMany({}, { active: false }); await RiskModel.updateOne({ _id: target._id }, { active: true }); await audit(req.requestId, req.auth!.userId, "risk_model.activated", { modelId: req.params.id }); res.json({ id: String(target._id), active: true }); } catch (error) { next(error); }
});
router.get("/api/admin/ai-prompts", requireAuth, requireAdmin, async (_req, res, next) => { try { res.json({ prompts: await AIPromptTemplate.find({}).sort({ updatedAt: -1 }).lean() }); } catch (error) { next(error); } });
router.post("/api/admin/ai-prompts", requireAuth, requireAdmin, async (req, res, next) => {
  try { const body = z.object({ key: z.string().min(2).max(80), content: z.string().min(20).max(10_000), active: z.boolean().default(true) }).parse(req.body); const prompt = await AIPromptTemplate.create({ ...body, updatedBy: req.auth!.userId }); await audit(req.requestId, req.auth!.userId, "ai_prompt.created", { key: body.key }); res.status(201).json({ prompt }); } catch (error) { next(error); }
});
router.patch("/api/admin/ai-prompts/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try { const body = z.object({ content: z.string().min(20).max(10_000).optional(), active: z.boolean().optional() }).parse(req.body); const prompt = await AIPromptTemplate.findByIdAndUpdate(req.params.id, { ...body, updatedBy: req.auth!.userId, $inc: { version: 1 } }, { new: true }); if (!prompt) throw new ApiError(404, "NOT_FOUND", "Prompt template was not found."); await audit(req.requestId, req.auth!.userId, "ai_prompt.updated", { promptId: req.params.id }); res.json({ prompt }); } catch (error) { next(error); }
});
router.get("/api/admin/ai-providers", requireAuth, requireAdmin, async (_req, res, next) => {
  try { res.json({ selected: process.env.AI_PROVIDER ?? "mock", providers: ["mock", "openai", "anthropic", "openrouter", "groq", "together", "ollama", "gemini"], openAiFeatureEnabled: (await getFeatureFlags()).enable_openai_provider }); } catch (error) { next(error); }
});
router.get("/api/admin/jobs", requireAuth, requireAdmin, async (_req, res, next) => {
  try { const queues = getQueues(); const counts = await Promise.all(Object.entries(queues).map(async ([name, queue]) => [name, await queue.getJobCounts("waiting", "active", "completed", "failed", "delayed")])); res.json({ queues: Object.fromEntries(counts) }); } catch (error) { next(error); }
});
router.get("/api/admin/reports", requireAuth, requireAdmin, async (_req, res, next) => { try { res.json({ reports: await Report.find({}).sort({ createdAt: -1 }).lean() }); } catch (error) { next(error); } });
router.get("/api/admin/audit-logs", requireAuth, requireAdmin, async (_req, res, next) => { try { res.json({ logs: await AuditLog.find({}).sort({ createdAt: -1 }).limit(500).lean() }); } catch (error) { next(error); } });

export { router };
