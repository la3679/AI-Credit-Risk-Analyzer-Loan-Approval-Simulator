import "dotenv/config";
import argon2 from "argon2";
import crypto from "node:crypto";
import { DEFAULT_FEATURE_FLAGS, DEFAULT_RISK_MODEL, calculateRisk, type FinancialInput } from "@credora/shared";
import { connectDatabase } from "../db";
import { AIPromptTemplate, BorrowerProfile, FeatureFlag, ImprovementPlan, LoanScenario, Report, RiskAnalysis, RiskModel, Session, User } from "../models";

const demoInputs: FinancialInput[] = [
  { annualIncome: 95000, creditScore: 760, monthlyDebt: 850, requestedLoanAmount: 18000, loanTermMonths: 36, loanPurpose: "home improvement", employmentYears: 6, creditUtilization: .22 },
  { annualIncome: 72000, creditScore: 690, monthlyDebt: 1100, requestedLoanAmount: 15000, loanTermMonths: 48, loanPurpose: "debt consolidation", employmentYears: 3, creditUtilization: .38 },
  { annualIncome: 64000, creditScore: 655, monthlyDebt: 1250, requestedLoanAmount: 12000, loanTermMonths: 36, loanPurpose: "major purchase", employmentYears: 2, creditUtilization: .44 },
  { annualIncome: 128000, creditScore: 805, monthlyDebt: 900, requestedLoanAmount: 32000, loanTermMonths: 48, loanPurpose: "home improvement", employmentYears: 10, creditUtilization: .12 },
  { annualIncome: 58000, creditScore: 618, monthlyDebt: 1550, requestedLoanAmount: 9000, loanTermMonths: 36, loanPurpose: "education", employmentYears: 1, creditUtilization: .62, missedPaymentsLast12Months: 1 },
  { annualIncome: 87000, creditScore: 735, monthlyDebt: 700, requestedLoanAmount: 20000, loanTermMonths: 60, loanPurpose: "major purchase", employmentYears: 5, creditUtilization: .29 },
  { annualIncome: 51000, creditScore: 610, monthlyDebt: 1050, requestedLoanAmount: 7000, loanTermMonths: 24, loanPurpose: "debt consolidation", employmentYears: 2, creditUtilization: .56 },
  { annualIncome: 108000, creditScore: 780, monthlyDebt: 1400, requestedLoanAmount: 28000, loanTermMonths: 48, loanPurpose: "home improvement", employmentYears: 8, creditUtilization: .18 },
];

async function reset() {
  await Promise.all([User.deleteMany({}), Session.deleteMany({}), BorrowerProfile.deleteMany({}), RiskAnalysis.deleteMany({}), LoanScenario.deleteMany({}), ImprovementPlan.deleteMany({}), Report.deleteMany({}), FeatureFlag.deleteMany({}), RiskModel.deleteMany({}), AIPromptTemplate.deleteMany({})]);
}

async function seed() {
  await reset();
  const passwordHash = await argon2.hash("CredoraDemo!2026", { type: argon2.argon2id });
  const [admin, user, guest] = await User.create([
    { name: "Credora Admin", email: "admin@credora.local", passwordHash, role: "admin" },
    { name: "Demo Analyst", email: "analyst@credora.local", passwordHash, role: "user" },
    { name: "Demo Guest", email: "guest@demo.credora.local", passwordHash, role: "guest", isGuest: true, expiresAt: new Date(Date.now() + 24 * 86_400_000) },
  ]);
  await Session.create({ ownerId: guest._id, tokenHash: await argon2.hash(crypto.randomBytes(32).toString("base64url"), { type: argon2.argon2id }), csrfToken: crypto.randomBytes(24).toString("base64url"), expiresAt: new Date(Date.now() + 24 * 86_400_000) });
  await FeatureFlag.insertMany(Object.entries(DEFAULT_FEATURE_FLAGS).map(([key, enabled]) => ({ key, enabled, updatedBy: admin._id })));
  await RiskModel.create({ version: DEFAULT_RISK_MODEL.version, active: true, config: DEFAULT_RISK_MODEL, ownerId: admin._id });
  await AIPromptTemplate.create({ key: "underwriting-memo", content: "Summarize the deterministic output in two short paragraphs. Describe material strengths and tradeoffs plainly, then offer one or two simulation-only what-if ideas. Keep the tone measured and educational.", active: true, updatedBy: admin._id });
  const profiles = await BorrowerProfile.create(demoInputs.map((input, index) => ({ ownerId: user._id, displayName: `Demo borrower ${index + 1}`, anonymized: true, baselineFinancials: input, tags: index % 2 ? ["comparison"] : ["baseline"] })));
  const analyses = await RiskAnalysis.create(Array.from({ length: 20 }, (_, index) => {
    const input = { ...demoInputs[index % demoInputs.length], requestedLoanAmount: demoInputs[index % demoInputs.length].requestedLoanAmount + (index % 4) * 750 };
    return { ownerId: user._id, profileId: profiles[index % profiles.length]._id, input, ...calculateRisk(input) };
  }));
  await LoanScenario.create(Array.from({ length: 6 }, (_, index) => ({ ownerId: user._id, name: `Scenario comparison ${index + 1}`, baseAnalysisId: analyses[index]._id, inputs: analyses[index].input, resultSnapshot: analyses[index].result, comparisonGroup: `comparison-${index + 1}` })));
  await ImprovementPlan.create(Array.from({ length: 4 }, (_, index) => ({ ownerId: user._id, analysisId: analyses[index]._id, title: `Improvement plan ${index + 1}`, items: [{ title: "Lower revolving debt", description: "Model a lower monthly debt obligation.", priority: "high", estimatedImpact: 8, completed: false }, { title: "Review loan amount", description: "Test a smaller requested loan amount.", priority: "medium", estimatedImpact: 5, completed: false }] })));
  await Report.create(Array.from({ length: 5 }, (_, index) => ({ ownerId: user._id, analysisId: analyses[index]._id, title: `Demo simulation report ${index + 1}`, modelVersion: (analyses[index].explanation as any).modelVersion, status: "completed", pdfUrl: `/api/reports/demo-${index + 1}/download`, contentMarkdown: "Educational demo report record.", expiresAt: new Date(Date.now() + 30 * 86_400_000) })));
  console.log("Seeded Credora demo data: 8 profiles, 20 analyses, 6 scenarios, 4 plans, 5 reports, admin, user, and guest session.");
}

connectDatabase().then(seed).then(() => process.exit(0)).catch((error) => { console.error(error); process.exit(1); });
