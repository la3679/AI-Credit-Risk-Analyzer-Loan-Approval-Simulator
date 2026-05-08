import React from 'react';
import { RiskResult } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { CheckCircle2, XCircle, Info } from 'lucide-react';

interface ResultsDisplayProps {
  result: RiskResult;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-none shadow-lg bg-white/90">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-slate-700">Approval Probability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end justify-between">
              <span className="text-5xl font-bold text-slate-900">
                {Math.round(result.approvalProbability * 100)}%
              </span>
              <span className="text-sm text-slate-500 mb-2">Likelihood of Approval</span>
            </div>
            <Progress value={result.approvalProbability * 100} className="h-3" />
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-white/90">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-slate-700">Loan Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Recommended Amount</span>
              <span className="text-xl font-bold text-slate-900">${result.recommendedAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Suggested Interest Rate</span>
              <span className="text-xl font-bold text-blue-600">{result.suggestedInterestRate}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-lg bg-white/90">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-slate-700">Key Influencing Factors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {result.factors.map((factor, index) => (
              <div key={index} className="flex items-start gap-4 p-3 rounded-lg bg-slate-50 border border-slate-100">
                {factor.impact === 'positive' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                ) : factor.impact === 'negative' ? (
                  <XCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                ) : (
                  <Info className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                )}
                <div>
                  <h4 className="font-semibold text-slate-900">{factor.name}</h4>
                  <p className="text-sm text-slate-600">{factor.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
