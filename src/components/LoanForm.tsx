import React from 'react';
import { FinancialData } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface LoanFormProps {
  onSubmit: (data: FinancialData) => void;
  isLoading: boolean;
  initialData?: FinancialData | null;
}

export const LoanForm: React.FC<LoanFormProps> = ({ onSubmit, isLoading, initialData }) => {
  const [formData, setFormData] = React.useState<FinancialData>({
    age: 30,
    income: 50000,
    employmentStatus: 'employed',
    creditScore: 700,
    existingLoans: 0,
    monthlyExpenses: 1500,
    loanAmount: 10000,
    loanPurpose: 'Debt Consolidation'
  });

  React.useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'loanPurpose' || name === 'otherLoanPurpose' ? value : Number(value)
    }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, employmentStatus: value as any }));
  };

  const handlePurposeChange = (value: string) => {
    setFormData(prev => ({ ...prev, loanPurpose: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const loanPurposes = [
    'Debt Consolidation',
    'Home Improvement',
    'Business Expansion',
    'Education',
    'Medical Expenses',
    'Vehicle Purchase',
    'Other'
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto border-none shadow-xl bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">Financial Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input id="age" name="age" type="number" value={formData.age} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="income">Annual Income ($)</Label>
              <Input id="income" name="income" type="number" value={formData.income} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employmentStatus">Employment Status</Label>
              <Select onValueChange={handleSelectChange} value={formData.employmentStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employed">Employed</SelectItem>
                  <SelectItem value="self-employed">Self-Employed</SelectItem>
                  <SelectItem value="unemployed">Unemployed</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="creditScore">Credit Score (300-850)</Label>
              <Input id="creditScore" name="creditScore" type="number" min="300" max="850" value={formData.creditScore} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthlyExpenses">Monthly Expenses ($)</Label>
              <Input id="monthlyExpenses" name="monthlyExpenses" type="number" value={formData.monthlyExpenses} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="existingLoans">Existing Loans Count</Label>
              <Input id="existingLoans" name="existingLoans" type="number" value={formData.existingLoans} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="loanAmount">Requested Loan Amount ($)</Label>
              <Input id="loanAmount" name="loanAmount" type="number" value={formData.loanAmount} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="loanPurpose">Loan Purpose</Label>
              <Select onValueChange={handlePurposeChange} value={formData.loanPurpose}>
                <SelectTrigger>
                  <SelectValue placeholder="Select purpose" />
                </SelectTrigger>
                <SelectContent>
                  {loanPurposes.map(purpose => (
                    <SelectItem key={purpose} value={purpose}>{purpose}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formData.loanPurpose === 'Other' && (
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="otherLoanPurpose">Specify Other Purpose</Label>
                <Input 
                  id="otherLoanPurpose" 
                  name="otherLoanPurpose" 
                  type="text" 
                  value={formData.otherLoanPurpose || ''} 
                  onChange={handleChange} 
                  required 
                  placeholder="Enter loan purpose..."
                />
              </div>
            )}
          </div>
          <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white py-6 text-lg font-medium transition-all" disabled={isLoading}>
            {isLoading ? 'Analyzing Risk...' : 'Analyze Credit Risk'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
