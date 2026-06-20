import { z } from "zod";

export const APP_BRAND = {
  name: "Credora AI",
  shortName: "Credora",
  tagline: "Credit intelligence, explainable risk, and loan simulation in one reactive fintech workspace.",
} as const;

export const SIMULATOR_DISCLAIMER =
  "Credora AI is an educational simulator and portfolio project. It does not provide financial advice, lending decisions, credit reports, or regulatory-compliant underwriting. Do not enter sensitive personal information.";

export const featureFlagKeys = [
  "enable_ai_memos",
  "enable_pdf_reports",
  "enable_demo_mode",
  "enable_admin_model_editor",
  "enable_portfolio_analytics",
  "enable_openai_provider",
] as const;
export type FeatureFlagKey = (typeof featureFlagKeys)[number];

export const userRoleSchema = z.enum(["user", "admin", "guest"]);
export type UserRole = z.infer<typeof userRoleSchema>;

export const reportStatusSchema = z.enum([
  "queued",
  "processing",
  "completed",
  "failed",
  "expired",
  "deleted",
]);
export type ReportStatus = z.infer<typeof reportStatusSchema>;

export const financialInputSchema = z.object({
  annualIncome: z.number().min(1_000).max(10_000_000),
  creditScore: z.number().int().min(300).max(850),
  monthlyDebt: z.number().min(0).max(1_000_000),
  requestedLoanAmount: z.number().min(100).max(5_000_000),
  loanTermMonths: z.number().int().min(6).max(120),
  loanPurpose: z.string().trim().min(2).max(100),
  employmentYears: z.number().min(0).max(60).optional(),
  creditUtilization: z.number().min(0).max(1).optional(),
  missedPaymentsLast12Months: z.number().int().min(0).max(24).optional(),
  openCreditLines: z.number().int().min(0).max(100).optional(),
  previousDefaults: z.number().int().min(0).max(10).optional(),
  downPayment: z.number().min(0).max(5_000_000).optional(),
  housingStatus: z.enum(["rent", "own", "family", "other"]).optional(),
});
export type FinancialInput = z.infer<typeof financialInputSchema>;

export const riskFactorSchema = z.object({
  label: z.string(),
  direction: z.enum(["positive", "negative", "neutral"]),
  impact: z.number(),
  explanation: z.string(),
});

export const riskAnalysisResultSchema = z.object({
  derived: z.object({
    monthlyIncome: z.number(),
    estimatedMonthlyPayment: z.number(),
    dtiBeforeLoan: z.number(),
    dtiAfterLoan: z.number(),
    loanToIncomeRatio: z.number(),
  }),
  result: z.object({
    approvalProbability: z.number().min(0).max(1),
    riskScore: z.number().min(0).max(100),
    riskBand: z.enum(["excellent", "good", "fair", "borderline", "high_risk"]),
    simulatedDecision: z.enum(["likely_approved", "manual_review", "likely_declined"]),
    suggestedAprMin: z.number(),
    suggestedAprMax: z.number(),
    affordabilityGrade: z.enum(["A", "B", "C", "D", "F"]),
  }),
  explanation: z.object({
    positiveFactors: z.array(riskFactorSchema),
    negativeFactors: z.array(riskFactorSchema),
    warnings: z.array(z.string()),
    modelVersion: z.string(),
  }),
});
export type RiskAnalysisResult = z.infer<typeof riskAnalysisResultSchema>;

export const signupSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().email().max(254).transform((email) => email.toLowerCase()),
  password: z.string().min(12).max(128),
});
export const loginSchema = signupSchema.pick({ email: true, password: true });

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    requestId: z.string(),
    details: z.array(z.unknown()).optional(),
  }),
});

export const DEFAULT_FEATURE_FLAGS: Record<FeatureFlagKey, boolean> = {
  enable_ai_memos: true,
  enable_pdf_reports: true,
  enable_demo_mode: true,
  enable_admin_model_editor: true,
  enable_portfolio_analytics: true,
  enable_openai_provider: false,
};

export interface RiskModelConfig {
  version: string;
  baseScore: number;
  weights: {
    creditScore: number;
    income: number;
    dti: number;
    loanToIncome: number;
    employmentYears: number;
    utilization: number;
    missedPayments: number;
    defaults: number;
  };
}

export interface AutopilotCandidate {
  id: string;
  title: string;
  tradeoff: string;
  input: FinancialInput;
  result: RiskAnalysisResult;
  approvalProbabilityDelta: number;
  dtiDelta: number;
}

export const DEFAULT_RISK_MODEL: RiskModelConfig = {
  version: "v2.0.0",
  baseScore: 52,
  weights: {
    creditScore: 28,
    income: 12,
    dti: 30,
    loanToIncome: 18,
    employmentYears: 6,
    utilization: 12,
    missedPayments: 6,
    defaults: 14,
  },
};

const round = (value: number, decimals = 2) => Number(value.toFixed(decimals));
const sigmoid = (value: number) => 1 / (1 + Math.exp(-value));

export function calculateMonthlyPayment(principal: number, annualRate: number, termMonths: number) {
  const rate = annualRate / 100 / 12;
  if (rate === 0) return principal / termMonths;
  return (principal * rate * (1 + rate) ** termMonths) / ((1 + rate) ** termMonths - 1);
}

export function calculateRisk(input: FinancialInput, model: RiskModelConfig = DEFAULT_RISK_MODEL): RiskAnalysisResult {
  const monthlyIncome = input.annualIncome / 12;
  const provisionalRate = 12;
  const estimatedMonthlyPayment = calculateMonthlyPayment(input.requestedLoanAmount - (input.downPayment ?? 0), provisionalRate, input.loanTermMonths);
  const dtiBeforeLoan = input.monthlyDebt / monthlyIncome;
  const dtiAfterLoan = (input.monthlyDebt + estimatedMonthlyPayment) / monthlyIncome;
  const loanToIncomeRatio = input.requestedLoanAmount / input.annualIncome;
  const credit = (input.creditScore - 300) / 550;
  const income = Math.min(input.annualIncome / 200_000, 1);
  const utilization = input.creditUtilization ?? 0.3;
  const employment = Math.min((input.employmentYears ?? 1) / 10, 1);

  let raw = model.baseScore;
  raw += credit * model.weights.creditScore;
  raw += income * model.weights.income;
  raw -= Math.min(dtiAfterLoan, 1) * model.weights.dti;
  raw -= Math.min(loanToIncomeRatio, 1.5) * model.weights.loanToIncome;
  raw += employment * model.weights.employmentYears;
  raw -= utilization * model.weights.utilization;
  raw -= Math.min((input.missedPaymentsLast12Months ?? 0) / 6, 1) * model.weights.missedPayments;
  raw -= Math.min((input.previousDefaults ?? 0) / 2, 1) * model.weights.defaults;
  const riskScore = Math.max(0, Math.min(100, round(raw)));
  const approvalProbability = round(sigmoid((riskScore - 50) / 10), 4);
  const riskBand = riskScore >= 90 ? "excellent" : riskScore >= 75 ? "good" : riskScore >= 60 ? "fair" : riskScore >= 45 ? "borderline" : "high_risk";
  const simulatedDecision = riskScore >= 75 ? "likely_approved" : riskScore >= 55 ? "manual_review" : "likely_declined";
  const aprCenter = Math.max(5.5, Math.min(29.5, 31 - riskScore * 0.25 + dtiAfterLoan * 4));
  const positiveFactors = [] as z.infer<typeof riskFactorSchema>[];
  const negativeFactors = [] as z.infer<typeof riskFactorSchema>[];
  if (input.creditScore >= 720) positiveFactors.push({ label: "Strong credit score", direction: "positive", impact: 18, explanation: "Your simulated score indicates a stronger repayment history." });
  if (dtiAfterLoan <= 0.36) positiveFactors.push({ label: "Manageable debt-to-income", direction: "positive", impact: 15, explanation: "Projected debt obligations remain relatively low compared with income." });
  if ((input.employmentYears ?? 0) >= 2) positiveFactors.push({ label: "Employment stability", direction: "positive", impact: 6, explanation: "A longer employment history improves the stability signal." });
  if (input.creditScore < 620) negativeFactors.push({ label: "Credit score needs improvement", direction: "negative", impact: -20, explanation: "A lower simulated score reduces the approval signal." });
  if (dtiAfterLoan > 0.43) negativeFactors.push({ label: "High projected debt-to-income", direction: "negative", impact: -18, explanation: "The new payment pushes monthly debt high relative to income." });
  if (utilization > 0.5) negativeFactors.push({ label: "High credit utilization", direction: "negative", impact: -10, explanation: "High revolving utilization can weaken the simulated profile." });
  if ((input.missedPaymentsLast12Months ?? 0) > 0) negativeFactors.push({ label: "Recent missed payments", direction: "negative", impact: -8, explanation: "Recent missed payments increase simulated risk." });
  const warnings = ["Estimated simulated APR range is for educational/demo purposes only."];
  if (dtiAfterLoan > 0.5) warnings.push("Projected debt obligations exceed 50% of monthly income.");
  if (input.monthlyDebt > monthlyIncome) warnings.push("Monthly debt exceeds monthly income; review the entered figures.");
  if (input.requestedLoanAmount > input.annualIncome) warnings.push("Requested amount is high relative to annual income.");
  if (input.employmentYears === undefined || input.creditUtilization === undefined) warnings.push("Some optional stability inputs are missing, reducing the richness of this educational simulation.");
  if (!positiveFactors.length && !negativeFactors.length) warnings.push("This result is a simplified educational simulation, not an underwriting decision.");
  return {
    derived: { monthlyIncome: round(monthlyIncome), estimatedMonthlyPayment: round(estimatedMonthlyPayment), dtiBeforeLoan: round(dtiBeforeLoan), dtiAfterLoan: round(dtiAfterLoan), loanToIncomeRatio: round(loanToIncomeRatio) },
    result: { approvalProbability, riskScore, riskBand, simulatedDecision, suggestedAprMin: round(Math.max(4.9, aprCenter - 1.4)), suggestedAprMax: round(Math.min(36, aprCenter + 1.4)), affordabilityGrade: dtiAfterLoan <= 0.28 ? "A" : dtiAfterLoan <= 0.36 ? "B" : dtiAfterLoan <= 0.43 ? "C" : dtiAfterLoan <= 0.5 ? "D" : "F" },
    explanation: { positiveFactors, negativeFactors, warnings, modelVersion: model.version },
  };
}

export function generateWhatIfAutopilot(input: FinancialInput, model: RiskModelConfig = DEFAULT_RISK_MODEL): AutopilotCandidate[] {
  const baseline = calculateRisk(input, model);
  const candidates = [
    { id: "lower-loan", title: "Reduce requested amount by 10%", tradeoff: "Lower proceeds may require postponing part of the purchase.", input: { ...input, requestedLoanAmount: Math.round(input.requestedLoanAmount * .9) } },
    { id: "lower-debt", title: "Reduce monthly debt by 15%", tradeoff: "Requires paying down or refinancing existing obligations.", input: { ...input, monthlyDebt: Math.round(input.monthlyDebt * .85) } },
    { id: "larger-down-payment", title: "Increase down payment by $2,000", tradeoff: "Requires additional cash up front.", input: { ...input, downPayment: (input.downPayment ?? 0) + 2_000 } },
    { id: "longer-term", title: "Extend the term by 12 months", tradeoff: "May lower the payment while increasing total interest over time.", input: { ...input, loanTermMonths: Math.min(120, input.loanTermMonths + 12) } },
    { id: "higher-score", title: "Model a 30-point credit-score improvement", tradeoff: "Credit-score improvements take time and are not guaranteed.", input: { ...input, creditScore: Math.min(850, input.creditScore + 30) } },
  ];
  return candidates.map((candidate) => {
    const result = calculateRisk(candidate.input, model);
    return { ...candidate, result, approvalProbabilityDelta: round(result.result.approvalProbability - baseline.result.approvalProbability, 4), dtiDelta: round(result.derived.dtiAfterLoan - baseline.derived.dtiAfterLoan, 4) };
  }).sort((a, b) => b.approvalProbabilityDelta - a.approvalProbabilityDelta);
}
