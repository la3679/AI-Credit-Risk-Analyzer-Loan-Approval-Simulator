import { describe, expect, it } from "vitest";
import { calculateMonthlyPayment, calculateRisk, financialInputSchema, generateWhatIfAutopilot, getRiskBand, getSimulatedDecision, type RiskModelConfig } from "@credora/shared";

describe("Credora deterministic risk engine", () => {
  const base = { annualIncome: 90_000, creditScore: 760, monthlyDebt: 800, requestedLoanAmount: 18_000, loanTermMonths: 36, loanPurpose: "home improvement" };

  it("returns stable output for the same permitted input", () => {
    expect(calculateRisk(base)).toEqual(calculateRisk(base));
  });

  it("penalizes a materially worse debt profile", () => {
    const strong = calculateRisk(base);
    const stressed = calculateRisk({ ...base, creditScore: 610, monthlyDebt: 2_600, creditUtilization: .8, missedPaymentsLast12Months: 2 });
    expect(stressed.result.riskScore).toBeLessThan(strong.result.riskScore);
    expect(stressed.derived.dtiAfterLoan).toBeGreaterThan(strong.derived.dtiAfterLoan);
  });

  it("calculates a positive amortized monthly payment", () => {
    expect(calculateMonthlyPayment(10_000, 12, 36)).toBeGreaterThan(0);
    expect(calculateMonthlyPayment(12_000, 0, 12)).toBe(1_000);
  });

  it("maps every risk and decision boundary deterministically", () => {
    expect(getRiskBand(90)).toBe("excellent");
    expect(getRiskBand(75)).toBe("good");
    expect(getRiskBand(60)).toBe("fair");
    expect(getRiskBand(45)).toBe("borderline");
    expect(getRiskBand(44)).toBe("high_risk");
    expect(getSimulatedDecision(75)).toBe("likely_approved");
    expect(getSimulatedDecision(55)).toBe("manual_review");
    expect(getSimulatedDecision(54)).toBe("likely_declined");
  });

  it("uses a validated model version and honors configured score boundaries", () => {
    const neutralWeights: RiskModelConfig["weights"] = { creditScore: 0, income: 0, dti: 0, loanToIncome: 0, employmentYears: 0, utilization: 0, missedPayments: 0, defaults: 0 };
    const result = calculateRisk(base, { version: "test-v9", baseScore: 75, weights: neutralWeights });
    expect(result.result.riskScore).toBe(75);
    expect(result.result.riskBand).toBe("good");
    expect(result.result.simulatedDecision).toBe("likely_approved");
    expect(result.explanation.modelVersion).toBe("test-v9");
  });

  it("raises the APR and emits negative factors for a stressed profile", () => {
    const strong = calculateRisk(base);
    const stressed = calculateRisk({ ...base, creditScore: 590, monthlyDebt: 4_000, requestedLoanAmount: 80_000, creditUtilization: .85, missedPaymentsLast12Months: 2, previousDefaults: 1 });
    expect(stressed.result.suggestedAprMin).toBeGreaterThan(strong.result.suggestedAprMin);
    expect(stressed.explanation.negativeFactors.length).toBeGreaterThan(0);
    expect(stressed.explanation.warnings.some((warning) => warning.includes("Projected debt"))).toBe(true);
  });

  it("rejects protected or undeclared input fields", () => {
    expect(() => financialInputSchema.parse({ ...base, gender: "female" })).toThrow();
  });

  it("ranks what-if candidates by simulated approval improvement", () => {
    const candidates = generateWhatIfAutopilot({ ...base, creditScore: 640, monthlyDebt: 1_800, creditUtilization: .6 });
    expect(candidates).toHaveLength(5);
    expect(candidates.every((candidate, index) => index === 0 || candidates[index - 1].approvalProbabilityDelta >= candidate.approvalProbabilityDelta)).toBe(true);
  });
});
