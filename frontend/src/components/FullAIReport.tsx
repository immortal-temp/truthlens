import React, { useState } from 'react';
import { AIReportResponse, ExtractedEntities } from '../types/verification';
import { Bot, User, Building2, MapPin, Hash, AlertCircle, ChevronDown, ChevronUp, FileText } from 'lucide-react';

interface FullAIReportProps {
  aiReport?: AIReportResponse;
  extractedEntities: ExtractedEntities;
  providerUsed: string;
}

export const FullAIReport: React.FC<FullAIReportProps> = ({
  aiReport,
  extractedEntities,
  providerUsed,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);

  if (!aiReport) return null;

  return (
    <div className="glass-panel rounded-2xl p-6 border-slate-800 border">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between cursor-pointer select-none mb-4"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-slate-100">Structured AI Evidence Analysis</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950/60 border border-sky-800 text-sky-300">
                Engine: {providerUsed.includes('fallback') ? 'CROSS-SOURCE SYNTHESIS' : providerUsed.toUpperCase()}
              </span>
            </div>
            <span className="text-xs text-slate-400">Strictly synthesized from indexed articles — zero invented facts</span>
          </div>
        </div>

        <button className="p-1 rounded-lg text-slate-400 hover:text-slate-200">
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {isOpen && (
        <div className="space-y-6 pt-2 border-t border-slate-800/80">
          {/* Executive Summary */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Executive Summary</h4>
            <p className="text-sm text-slate-200 bg-slate-900/60 p-4 rounded-xl border border-slate-800 leading-relaxed">
              {aiReport.executive_summary}
            </p>
          </div>

          {/* What happened bullet points */}
          {aiReport.what_happened && aiReport.what_happened.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">What The Evidence Shows</h4>
              <ul className="space-y-2">
                {aiReport.what_happened.map((pt, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0" />
                    <span className="leading-relaxed">{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Extracted Entities Grid */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Extracted Entity Context</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800">
                <span className="text-slate-400 flex items-center gap-1.5 font-medium mb-1">
                  <User className="w-3.5 h-3.5 text-sky-400" /> Key People
                </span>
                <span className="text-slate-200 font-medium">
                  {extractedEntities.people.length > 0 ? extractedEntities.people.join(', ') : 'None listed'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800">
                <span className="text-slate-400 flex items-center gap-1.5 font-medium mb-1">
                  <Building2 className="w-3.5 h-3.5 text-indigo-400" /> Organizations
                </span>
                <span className="text-slate-200 font-medium">
                  {extractedEntities.organizations.length > 0 ? extractedEntities.organizations.join(', ') : 'None listed'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800">
                <span className="text-slate-400 flex items-center gap-1.5 font-medium mb-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Locations
                </span>
                <span className="text-slate-200 font-medium">
                  {extractedEntities.locations.length > 0 ? extractedEntities.locations.join(', ') : 'None listed'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800">
                <span className="text-slate-400 flex items-center gap-1.5 font-medium mb-1">
                  <Hash className="w-3.5 h-3.5 text-amber-400" /> Figures & Amounts
                </span>
                <span className="text-slate-200 font-medium">
                  {extractedEntities.amounts.length > 0 ? extractedEntities.amounts.join(', ') : 'None listed'}
                </span>
              </div>
            </div>
          </div>

          {/* Final Assessment */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Final Grounded Assessment</h4>
            <p className="text-xs text-slate-300 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 leading-relaxed font-medium">
              {aiReport.final_assessment}
            </p>
          </div>

          {/* Limitations */}
          {aiReport.limitations && aiReport.limitations.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-850">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mb-2">
                <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                Methodological Limitations
              </span>
              <ul className="space-y-1.5">
                {aiReport.limitations.map((lim, idx) => (
                  <li key={idx} className="text-[11px] text-slate-400 flex items-start gap-2">
                    <span className="text-slate-600">•</span>
                    <span>{lim}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
