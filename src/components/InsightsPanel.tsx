import React from 'react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { FinancialData, RiskResult, ImprovementSuggestion } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Lightbulb, Sparkles, Loader2, ShieldCheck } from 'lucide-react';

interface InsightsPanelProps {
  data: FinancialData;
  result: RiskResult;
  suggestions: ImprovementSuggestion[];
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({ data, result, suggestions }) => {
  const [aiExplanation, setAiExplanation] = React.useState<string>('');
  const [isGenerating, setIsGenerating] = React.useState(false);

  React.useEffect(() => {
    const generateAiInsights = async () => {
      if (!process.env.GEMINI_API_KEY) return;
      
      setIsGenerating(true);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `
          As a senior financial advisor, explain the credit risk analysis for a loan applicant.
          Applicant Data:
          - Income: $${data.income}
          - Age: ${data.age}
          - Credit Score: ${data.creditScore}
          - Monthly Expenses: $${data.monthlyExpenses}
          - Loan Amount Requested: $${data.loanAmount}
          - Loan Purpose: ${data.loanPurpose === 'Other' ? data.otherLoanPurpose : data.loanPurpose}
          
          Analysis Result:
          - Risk Score: ${result.riskScore}/100
          - Risk Category: ${result.riskCategory}
          - Approval Probability: ${Math.round(result.approvalProbability * 100)}%
          
          Provide a professional, well-formatted explanation using Markdown. 
          Use bold text for key metrics, bullet points for clarity, and clear headings.
          Include 3 actionable tips to improve their financial standing.
        `;

        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
        });

        setAiExplanation(response.text || 'Unable to generate AI insights at this time.');
      } catch (error) {
        console.error('AI Insight Error:', error);
        setAiExplanation('Error generating AI insights. Please try again later.');
      } finally {
        setIsGenerating(false);
      }
    };

    generateAiInsights();
  }, [data, result]);

  return (
    <div className="space-y-8">
      {/* AI Intelligence Report */}
      <Card className="border-none shadow-2xl bg-[#0a0502] text-white overflow-hidden relative">
        {/* Atmospheric Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[100px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[100px] rounded-full" />
          <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-amber-600/10 blur-[80px] rounded-full" />
        </div>

        <CardHeader className="relative z-10 border-b border-white/5 bg-white/5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-xl border border-blue-500/30">
                <Sparkles className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold tracking-tight">AI Intelligence Report</CardTitle>
                <p className="text-xs text-blue-400/60 uppercase tracking-widest font-semibold">Deep Risk Synthesis</p>
              </div>
            </div>
            {isGenerating && (
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">
                <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
                <span className="text-[10px] uppercase tracking-widest font-bold text-blue-400">Processing</span>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="relative z-10 p-8">
          {isGenerating ? (
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-white/5 rounded w-3/4"></div>
              <div className="h-4 bg-white/5 rounded w-full"></div>
              <div className="h-4 bg-white/5 rounded w-5/6"></div>
              <div className="h-32 bg-white/5 rounded w-full mt-8"></div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="prose prose-invert max-w-none prose-p:text-slate-300 prose-p:leading-relaxed prose-strong:text-blue-400 prose-headings:text-white prose-headings:font-bold"
            >
              <div className="font-serif italic text-lg text-slate-200/90 border-l-2 border-blue-500/50 pl-6 py-2 mb-8 bg-blue-500/5">
                <ReactMarkdown>{aiExplanation}</ReactMarkdown>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Actionable Suggestions */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <ShieldCheck className="w-5 h-5 text-slate-900" />
          <h3 className="text-lg font-bold text-slate-900">Strategic Improvements</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suggestions.length > 0 ? (
            suggestions.map((suggestion, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="p-5 rounded-2xl bg-white shadow-sm border border-slate-100 hover:shadow-xl transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <Badge className={`${
                    suggestion.priority === 'High' ? 'bg-red-100 text-red-700' : 
                    suggestion.priority === 'Medium' ? 'bg-amber-100 text-amber-700' : 
                    'bg-blue-100 text-blue-700'
                  } border-none font-bold px-2.5 py-0.5 rounded-lg text-[10px] uppercase tracking-wider`}>
                    {suggestion.priority} Priority
                  </Badge>
                  <div className="p-1.5 bg-slate-50 rounded-lg group-hover:bg-slate-900 group-hover:text-white transition-colors">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                </div>
                <h4 className="font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{suggestion.title}</h4>
                <p className="text-sm text-slate-600 leading-relaxed">{suggestion.description}</p>
              </motion.div>
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full p-12 rounded-3xl bg-green-50/50 border border-dashed border-green-200 flex flex-col items-center text-center gap-4"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-green-900">Strong Financial Profile</h4>
                <p className="text-green-700 max-w-md mx-auto mt-1">
                  Our AI analysis indicates a robust credit standing. No critical improvements are required at this time.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
