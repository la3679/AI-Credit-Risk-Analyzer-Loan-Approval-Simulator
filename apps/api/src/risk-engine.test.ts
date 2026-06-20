import { describe, expect, it } from "vitest";
import { calculateMonthlyPayment, calculateRisk } from "@credora/shared";

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
  });
});
