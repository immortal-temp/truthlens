import React from 'react';
import { ScoreBreakdown } from '../types/verification';
import { ShieldCheck, Calendar, Sparkles, Award, Users, AlertCircle } from 'lucide-react';

interface ScoreGaugeProps {
  score: number;
  breakdown: ScoreBreakdown;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score, breakdown }) => {
  // Gauge color mapping
  const getScoreColor = (val: number) => {
    if (val >= 75) return '#10b981'; // Emerald
    if (val >= 50) return '#06b6d4'; // Cyan
    if (val >= 35) return '#f59e0b'; // Amber
    return '#f43f5e'; // Rose
  };

  const strokeColor = getScoreColor(score);
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const items = [
    { label: 'Source Agreement', val: breakdown.source_agreement, max: 25, icon: ShieldCheck, color: 'bg-emerald-500' },
    { label: 'Date Consistency', val: breakdown.date_consistency, max: 15, icon: Calendar, color: 'bg-blue-500' },
    { label: 'Semantic Similarity', val: breakdown.semantic_similarity, max: 20, icon: Sparkles, color: 'bg-purple-500' },
    { label: 'Source Quality', val: breakdown.source_quality, max: 20, icon: Award, color: 'bg-indigo-500' },
    { label: 'Cross-Source Corroboration', val: breakdown.cross_source_agreement, max: 10, icon: Users, color: 'bg-cyan-500' },
    { label: 'Contradiction Penalty Score', val: breakdown.contradictory_penalty, max: 10, icon: AlertCircle, color: 'bg-amber-500' },
  ];

  return (
    <div className="glass-panel rounded-2xl sm:rounded-3xl p-5 sm:p-7 md:p-8 border border-slate-800">
      <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
        {/* Circular Gauge */}
        <div className="relative flex flex-col items-center justify-center shrink-0">
          <svg className="w-36 h-36 sm:w-40 sm:h-40 transform -rotate-90">
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="#1e293b"
              strokeWidth="12"
              fill="transparent"
            />
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke={strokeColor}
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">{score}</span>
            <span className="text-[10px] sm:text-xs uppercase tracking-widest text-slate-400 font-semibold">/ 100</span>
          </div>
          <div className="mt-2 text-center max-w-xs">
            <span className="text-xs sm:text-sm font-semibold text-slate-300">Evidence Score: {score}/100</span>
            <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">Confidence metric based on verifiable multi-source evidence</p>
          </div>
        </div>

        {/* Breakdown bars */}
        <div className="flex-1 w-full space-y-2.5 sm:space-y-3">
          <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Score Breakdown Signals</h4>
          {items.map((item, idx) => {
            const Icon = item.icon;
            const pct = Math.round((item.val / item.max) * 100);
            return (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-center text-[11px] sm:text-xs font-medium">
                  <span className="flex items-center gap-1.5 text-slate-300 truncate mr-2">
                    <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </span>
                  <span className="text-slate-400 shrink-0">
                    <span className="font-bold text-slate-200">{item.val}</span> / {item.max} pts
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all duration-700`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
