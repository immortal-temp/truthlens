import React, { useState } from 'react';
import { NormalizedArticle } from '../types/verification';
import { ExternalLink, Filter, Search, Shield, ChevronDown, ChevronUp } from 'lucide-react';

interface SourceListProps {
  articles: NormalizedArticle[];
}

export const SourceList: React.FC<SourceListProps> = ({ articles }) => {
  const [filter, setFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const filtered = articles.filter(a => {
    const matchesFilter = 
      filter === 'ALL' || 
      (filter === 'SUPPORTING' && (a.evidence_classification === 'Supporting' || a.evidence_classification === 'Partially Supporting')) ||
      (filter === 'CONTRADICTING' && a.evidence_classification === 'Contradicting') ||
      (filter === 'NEUTRAL' && (a.evidence_classification === 'Neutral' || a.evidence_classification === 'Unrelated')) ||
      (filter === 'HIGH_CRED' && a.credibility_tier === 'High');

    const matchesSearch = 
      !searchQuery || 
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.source_name.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const getClassificationBadge = (cls?: string) => {
    switch (cls) {
      case 'Supporting':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Partially Supporting':
        return 'bg-teal-500/10 text-teal-300 border-teal-500/30';
      case 'Contradicting':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'Neutral':
        return 'bg-slate-500/10 text-slate-300 border-slate-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-6 border-slate-800 border">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <div>
          <h3 className="font-bold text-base sm:text-lg text-slate-100 flex items-center gap-2">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400" />
            Discovered Sources & Evidence ({articles.length})
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
            Sources discovered from real web news indexed during verification
          </p>
        </div>

        {/* Filters and search */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2.5">
          <div className="relative w-full sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search sources or titles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors w-full"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs">
            {['ALL', 'SUPPORTING', 'CONTRADICTING', 'HIGH_CRED'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-lg font-medium text-[11px] sm:text-xs transition-all ${
                  filter === f
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f === 'ALL' ? 'All' : f === 'HIGH_CRED' ? 'High Cred' : f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Article rows */}
      <div className="space-y-2.5">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            No sources matched your current search or filter.
          </div>
        ) : (
          filtered.map((art, idx) => {
            const isExpanded = expandedIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-xl bg-slate-900/40 border border-slate-800/80 hover:border-slate-700 transition-all overflow-hidden"
              >
                <div
                  onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                  className="p-4 flex items-start justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="font-bold text-xs text-sky-400">{art.source_name}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getClassificationBadge(art.evidence_classification)}`}>
                        {art.evidence_classification || 'Neutral'}
                      </span>
                      <span className="text-[10px] text-slate-400 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">
                        {art.credibility_type || 'Unknown Publisher'}
                      </span>
                      {art.published_at && (
                        <span className="text-[10px] text-slate-500">
                          {art.published_at.slice(0, 10)}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-semibold text-slate-200 hover:text-sky-300 transition-colors">
                      {art.title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 pt-1">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">Similarity</span>
                      <span className="text-xs font-bold text-slate-300">
                        {Math.round((art.semantic_similarity || 0) * 100)}%
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-800/50 bg-slate-950/40 space-y-3">
                    {art.description && (
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {art.description}
                      </p>
                    )}
                    {art.content && (
                      <p className="text-[11px] text-slate-400 bg-slate-900/60 p-3 rounded-lg border border-slate-800/60 leading-relaxed">
                        "{art.content}"
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-500">
                        Query used: <span className="text-slate-400 font-mono">{art.query_used || 'N/A'}</span>
                      </span>
                      <a
                        href={art.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-medium transition-colors"
                      >
                        Visit Original Source Article
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
