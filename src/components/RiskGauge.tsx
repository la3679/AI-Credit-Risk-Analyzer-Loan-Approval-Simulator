import React from 'react';
import { motion } from 'motion/react';

interface RiskGaugeProps {
  score: number;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({ score }) => {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s < 30) return '#22c55e'; // green-500
    if (s < 60) return '#eab308'; // yellow-500
    return '#ef4444'; // red-500
  };

  const getLabel = (s: number) => {
    if (s < 30) return 'Low Risk';
    if (s < 60) return 'Medium Risk';
    return 'High Risk';
  };

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg className="w-48 h-48 transform -rotate-90">
        <circle
          cx="96"
          cy="96"
          r={radius}
          stroke="#e2e8f0"
          strokeWidth="12"
          fill="transparent"
        />
        <motion.circle
          cx="96"
          cy="96"
          r={radius}
          stroke={getColor(score)}
          strokeWidth="12"
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center mt-[-10px]">
        <span className="text-4xl font-bold text-slate-900">{score}</span>
        <span className="text-xs font-medium uppercase tracking-widest text-slate-500">Risk Score</span>
      </div>
      <div className="mt-4">
        <span className={`px-4 py-1 rounded-full text-sm font-semibold text-white`} style={{ backgroundColor: getColor(score) }}>
          {getLabel(score)}
        </span>
      </div>
    </div>
  );
};
