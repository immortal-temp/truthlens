import React from 'react';
import { TimelineEvent } from '../types/verification';
import { Clock, ExternalLink, Calendar } from 'lucide-react';

interface TimelineViewProps {
  timeline?: TimelineEvent[];
}

export const TimelineView: React.FC<TimelineViewProps> = ({ timeline = [] }) => {
  if (!timeline || timeline.length === 0) {
    return null;
  }

  return (
    <div className="glass-panel rounded-2xl p-6 border-slate-800 border">
      <div className="flex items-center gap-2.5 mb-6">
        <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-base text-slate-100">Chronological Event Timeline</h3>
          <span className="text-xs text-slate-400">Sequence of documented events reported by indexed sources</span>
        </div>
      </div>

      <div className="relative pl-6 border-l-2 border-slate-800 space-y-6">
        {timeline.map((item, idx) => (
          <div key={idx} className="relative group">
            {/* Timeline node */}
            <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-indigo-500 border-2 border-slate-900 shadow-md group-hover:scale-125 transition-transform" />

            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 hover:border-indigo-500/40 transition-all">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 font-mono">
                  <Calendar className="w-3.5 h-3.5" />
                  {item.date || 'Undated'}
                </span>
                <span className="text-[11px] text-slate-400 font-medium px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                  {item.source_name}
                </span>
              </div>

              <h4 className="text-sm font-semibold text-slate-200 mb-1">
                {item.headline}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {item.description}
              </p>

              {item.url && (
                <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex justify-end">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                  >
                    View Source Report
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
