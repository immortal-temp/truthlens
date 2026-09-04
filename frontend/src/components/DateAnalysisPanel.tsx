import React from 'react';
import { DateAnalysisResult } from '../types/verification';
import { Calendar, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface DateAnalysisPanelProps {
  dateAnalysis: DateAnalysisResult;
}

export const DateAnalysisPanel: React.FC<DateAnalysisPanelProps> = ({ dateAnalysis }) => {
  return (
    <div className={`glass-panel rounded-2xl p-6 border ${
      dateAnalysis.is_old_news_reused 
        ? 'border-amber-500/40 bg-amber-950/10' 
        : 'border-slate-800'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-lg border ${
            dateAnalysis.is_old_news_reused 
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
              : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
          }`}>
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-100">Date Consistency & Temporal Analysis</h3>
            <span className="text-xs text-slate-400">Verifying claimed event timing against publication history</span>
          </div>
        </div>

        {dateAnalysis.is_old_news_reused ? (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            Old News Pattern Flagged
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
            <CheckCircle className="w-3.5 h-3.5" />
            Dates Consistent
          </div>
        )}
      </div>

      {dateAnalysis.warning_message && (
        <div className="mb-4 p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-xs text-amber-300 block">{dateAnalysis.warning_message}</span>
            <p className="text-xs text-amber-200/80 mt-1 leading-relaxed">{dateAnalysis.explanation}</p>
          </div>
        </div>
      )}

      {!dateAnalysis.warning_message && (
        <p className="text-xs text-slate-300 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80 mb-4 leading-relaxed">
          {dateAnalysis.explanation}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-400 block mb-1 font-medium">User-Supplied Date</span>
          <span className="font-bold text-slate-200 font-mono text-sm">{dateAnalysis.user_date || 'N/A'}</span>
        </div>
        <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-400 block mb-1 font-medium">Dates in Claim Text</span>
          <span className="font-bold text-slate-200 font-mono text-sm">
            {dateAnalysis.extracted_event_dates.length > 0 ? dateAnalysis.extracted_event_dates.join(', ') : 'None specified'}
          </span>
        </div>
        <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-400 block mb-1 font-medium">Reporting Dates Indexed</span>
          <span className="font-bold text-slate-200 font-mono text-sm">
            {dateAnalysis.article_publish_dates.length > 0 ? `${dateAnalysis.article_publish_dates.length} article timestamps` : 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
};
