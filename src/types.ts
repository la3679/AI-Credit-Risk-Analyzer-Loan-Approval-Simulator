export interface FinancialData {
  age: number;
  income: number;
  employmentStatus: 'employed' | 'unemployed' | 'self-employed' | 'student' | 'retired';
  creditScore: number;
  existingLoans: number;
  monthlyExpenses: number;
  loanAmount: number;
  loanPurpose: string;
  otherLoanPurpose?: string;
}

export interface RiskResult {
  riskScore: number; // 0-100
  riskCategory: 'Low' | 'Medium' | 'High';
  approvalProbability: number; // 0-1
  recommendedAmount: number;
  suggestedInterestRate: number;
  factors: {
    name: string;
    impact: 'positive' | 'negative' | 'neutral';
    description: string;
  }[];
}

export interface ImprovementSuggestion {
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
}
