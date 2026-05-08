import React from 'react';
import { FinancialData, RiskResult } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';

interface CompareScenariosProps {
  scenarios: { name: string; data: FinancialData; result: RiskResult }[];
}

export const CompareScenarios: React.FC<CompareScenariosProps> = ({ scenarios }) => {
  if (scenarios.length === 0) return <div className="text-center py-10 text-slate-500">No profiles to compare.</div>;

  return (
    <Card className="border-none shadow-lg bg-white/90">
      <CardHeader>
        <CardTitle className="text-lg font-medium text-slate-700">Profile Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                {scenarios.map((s, i) => (
                  <TableHead key={i} className="min-w-[150px]">{s.name}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Loan Amount</TableCell>
                {scenarios.map((s, i) => (
                  <TableCell key={i}>${s.data.loanAmount.toLocaleString()}</TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Risk Score</TableCell>
                {scenarios.map((s, i) => (
                  <TableCell key={i}>
                    <Badge variant={s.result.riskScore < 30 ? 'default' : s.result.riskScore < 60 ? 'secondary' : 'destructive'}>
                      {s.result.riskScore}
                    </Badge>
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Approval Prob.</TableCell>
                {scenarios.map((s, i) => (
                  <TableCell key={i}>{Math.round(s.result.approvalProbability * 100)}%</TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Interest Rate</TableCell>
                {scenarios.map((s, i) => (
                  <TableCell key={i} className="text-blue-600 font-bold">{s.result.suggestedInterestRate}%</TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Monthly Expenses</TableCell>
                {scenarios.map((s, i) => (
                  <TableCell key={i}>${s.data.monthlyExpenses.toLocaleString()}</TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
