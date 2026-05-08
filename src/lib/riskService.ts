import { FinancialData, RiskResult } from '../types';
import { defaultModel } from './ml';

export function calculateRisk(data: FinancialData): RiskResult {
  // 1. Feature Engineering & Normalization
  const incomeNorm = Math.min(data.income / 200000, 1); // Cap at 200k
  const creditScoreNorm = (data.creditScore - 300) / 550; // 300-850 range
  const dtiRatio = data.monthlyExpenses / (data.income / 12 || 1);
  const ltiRatio = data.loanAmount / (data.income || 1);
  const ageNorm = Math.min(data.age / 80, 1);

  const features = [incomeNorm, creditScoreNorm, dtiRatio, ltiRatio, ageNorm];

  // 2. Run ML Model
  const approvalProbability = defaultModel.predict(features);

  // 3. Calculate Risk Score (Inverse of probability for "Risk")
  const riskScore = Math.round((1 - approvalProbability) * 100);

  // 4. Determine Category
  let riskCategory: 'Low' | 'Medium' | 'High' = 'High';
  if (riskScore < 30) riskCategory = 'Low';
  else if (riskScore < 60) riskCategory = 'Medium';

  // 5. Recommended Amount & Interest Rate
  const recommendedAmount = Math.round(data.income * 0.4); // Simple rule: 40% of annual income
  const baseRate = 5.0;
  const suggestedInterestRate = parseFloat((baseRate + (riskScore / 10)).toFixed(2));

  // 6. Explainable Factors
  const factors: RiskResult['factors'] = [];

  if (creditScoreNorm > 0.7) {
    factors.push({ name: 'Credit Score', impact: 'positive', description: 'Excellent credit history demonstrates reliability.' });
  } else if (creditScoreNorm < 0.4) {
    factors.push({ name: 'Credit Score', impact: 'negative', description: 'Low credit score significantly increases perceived risk.' });
  }

  if (dtiRatio < 0.3) {
    factors.push({ name: 'Debt-to-Income', impact: 'positive', description: 'Low monthly expenses relative to income.' });
  } else if (dtiRatio > 0.5) {
    factors.push({ name: 'Debt-to-Income', impact: 'negative', description: 'High monthly debt obligations may hinder repayment.' });
  }

  if (ltiRatio > 0.5) {
    factors.push({ name: 'Loan-to-Income', impact: 'negative', description: 'Requested loan amount is high relative to annual income.' });
  }

  if (data.employmentStatus === 'employed') {
    factors.push({ name: 'Employment', impact: 'positive', description: 'Stable employment status provides consistent income stream.' });
  }

  return {
    riskScore,
    riskCategory,
    approvalProbability,
    recommendedAmount,
    suggestedInterestRate,
    factors
  };
}
