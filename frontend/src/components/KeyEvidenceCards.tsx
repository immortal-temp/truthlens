import React, { useState, useEffect } from 'react';
import { NormalizedArticle } from '../types/verification';
import { ExternalLink, Check, AlertTriangle, ShieldCheck, X, BookOpen, Calendar, Globe } from 'lucide-react';

interface KeyEvidenceCardsProps {
  articles: NormalizedArticle[];
  supportingSummary?: string;
  contradictingSummary?: string;
}

// Clean HTML entities from Google News snippets
const cleanSnippet = (text?: string): string => {
  if (!text) return '';
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/<[^>]*>/g, '')
    .trim();
};

export const KeyEvidenceCards: React.FC<KeyEvidenceCardsProps> = ({
  articles,
  supportingSummary,
  contradictingSummary,
}) => {
  const [selectedArticle, setSelectedArticle] = useState<NormalizedArticle | null>(null);

  const supporting = articles.filter(
    a => a.evidence_classification === 'Supporting' || a.evidence_classification === 'Partially Supporting'
  );
  const contradicting = articles.filter(
    a => a.evidence_classification === 'Contradicting'
  );

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedArticle(null);
    };
    if (selectedArticle) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedArticle]);

  const getCredBadge = (tier?: string) => {
    if (tier === 'High') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (tier === 'Medium') return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
    return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  };

  return (
    <div className="space-y-6">
      {/* Evidence Columns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Supporting Evidence Column (Wide & Prominent: 7 or 8 columns on large screens) */}
        <div className={`glass-panel rounded-3xl p-6 sm:p-7 border-slate-800 border flex flex-col ${contradicting.length > 0 ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
          {/* Header */}
          <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-md shadow-emerald-500/10">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-slate-100 flex items-center gap-2">
                  Supporting Corroboration
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    {supporting.length} sources
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Independent media reporting confirming the claim details</p>
              </div>
            </div>
          </div>

          {/* AI Summary Note */}
          {supportingSummary && (
            <div className="text-xs text-slate-300 bg-emerald-950/30 border border-emerald-800/40 rounded-2xl p-4 mb-4 leading-relaxed">
              <span className="font-bold text-emerald-400 block mb-1 text-[11px] uppercase tracking-wider">
                Corroborating Evidence Overview:
              </span>
              {cleanSnippet(supportingSummary)}
            </div>
          )}

          {/* Supporting Articles List (Shows 7-8 items) */}
          <div className="space-y-3 flex-1">
            {supporting.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 italic bg-slate-900/30 rounded-2xl border border-slate-800">
                No direct corroborating coverage indexed in live search.
              </div>
            ) : (
              supporting.slice(0, 8).map((art, idx) => {
                const snippet = cleanSnippet(art.description || art.content);
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedArticle(art)}
                    className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/50 hover:bg-slate-900/90 transition-all cursor-pointer group shadow-sm hover:shadow-lg hover:shadow-emerald-500/5 relative"
                  >
                    {/* Top Row: Publisher, Date & Credibility */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-emerald-400 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          {art.source_name}
                        </span>
                        {art.published_at && (
                          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            {art.published_at.slice(0, 10)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getCredBadge(art.credibility_tier)}`}>
                          {art.credibility_tier || 'Verified'}
                        </span>
                        <a
                          href={art.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-300 transition-colors"
                          title="Open direct URL"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    {/* Headline */}
                    <h4 className="text-xs sm:text-sm font-bold text-slate-200 group-hover:text-emerald-300 transition-colors leading-snug line-clamp-2">
                      {art.title}
                    </h4>

                    {/* Snippet / Description Preview */}
                    {snippet && (
                      <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                        {snippet}
                      </p>
                    )}

                    {/* Action Hint */}
                    <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
                      <span className="flex items-center gap-1 text-emerald-400/80 font-semibold group-hover:text-emerald-300">
                        <BookOpen className="w-3 h-3" />
                        Click to read article details & open link
                      </span>
                      <span className="font-mono text-slate-400">#0{idx + 1}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Contradicting Evidence Column (3-4 items or Clear Reassuring Note if zero) */}
        <div className={`glass-panel rounded-3xl p-6 sm:p-7 border-slate-800 border flex flex-col ${contradicting.length > 0 ? 'lg:col-span-5' : 'lg:col-span-12'}`}>
          {/* Header */}
          <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-2xl border ${contradicting.length > 0 ? 'bg-rose-500/15 border-rose-500/30 text-rose-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-slate-100 flex items-center gap-2">
                  Contradicting / Debunks
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${contradicting.length > 0 ? 'bg-rose-500/15 text-rose-300 border-rose-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                    {contradicting.length} flagged
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Conflicting reports, fact-checks, or refutations</p>
              </div>
            </div>
          </div>

          {/* AI Summary Note */}
          {contradictingSummary && (
            <div className="text-xs text-slate-300 bg-rose-950/30 border border-rose-800/40 rounded-2xl p-4 mb-4 leading-relaxed">
              <span className="font-bold text-rose-400 block mb-1 text-[11px] uppercase tracking-wider">
                Refutation Overview:
              </span>
              {cleanSnippet(contradictingSummary)}
            </div>
          )}

          {/* Contradicting List or Zero-Conflict Guarantee */}
          <div className="space-y-3 flex-1">
            {contradicting.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-center space-y-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-200">Zero Contradicting Reports Detected</h4>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed">
                  No independent fact-checkers or mainstream journalistic publishers reported contradictory facts for this event.
                </p>
              </div>
            ) : (
              contradicting.slice(0, 4).map((art, idx) => {
                const snippet = cleanSnippet(art.description || art.content);
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedArticle(art)}
                    className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-rose-500/50 hover:bg-slate-900/90 transition-all cursor-pointer group shadow-sm hover:shadow-lg hover:shadow-rose-500/5 relative"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-extrabold text-rose-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        {art.source_name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border bg-rose-500/10 text-rose-400 border-rose-500/20">
                          Refutation
                        </span>
                        <a
                          href={art.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-colors"
                          title="Open direct URL"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-slate-200 group-hover:text-rose-300 transition-colors leading-snug line-clamp-2">
                      {art.title}
                    </h4>

                    {snippet && (
                      <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                        {snippet}
                      </p>
                    )}

                    <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
                      <span className="flex items-center gap-1 text-rose-400/80 font-semibold group-hover:text-rose-300">
                        <BookOpen className="w-3 h-3" />
                        Click to view details & open link
                      </span>
                      <span className="font-mono text-slate-400">#0{idx + 1}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Interactive Article Detail Centered Modal Dialog */}
      {selectedArticle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedArticle(null)}
        >
          <div
            className="w-full max-w-xl bg-[#0d1322] border border-slate-700 rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-2xl shadow-black/95 relative animate-in zoom-in-95 duration-150 space-y-4 max-h-[88vh] sm:max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Bar */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl border shrink-0 ${
                  selectedArticle.evidence_classification === 'Contradicting'
                    ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                    : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                }`}>
                  {selectedArticle.evidence_classification === 'Contradicting' ? (
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-extrabold text-white block">
                    {selectedArticle.source_name}
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] text-slate-400">
                    <span>{selectedArticle.published_at?.slice(0, 10) || 'Date N/A'}</span>
                    <span>•</span>
                    <span className={`font-semibold ${
                      selectedArticle.evidence_classification === 'Contradicting' ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {selectedArticle.evidence_classification}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedArticle(null)}
                className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Article Title */}
            <h3 className="text-sm sm:text-base md:text-lg font-extrabold text-white leading-snug break-words">
              {selectedArticle.title}
            </h3>

            {/* Credibility & Metadata Pill Tags */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1">
              <span className={`text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 rounded-xl border ${getCredBadge(selectedArticle.credibility_tier)}`}>
                {selectedArticle.credibility_tier || 'Verified'} Credibility
              </span>
              {selectedArticle.credibility_type && (
                <span className="text-[11px] sm:text-xs font-medium px-2.5 sm:px-3 py-1 rounded-xl bg-slate-800 text-slate-300 border border-slate-700">
                  {selectedArticle.credibility_type}
                </span>
              )}
            </div>

            {/* Full Extracted Description / Content */}
            <div className="space-y-1.5 pt-1 sm:pt-2">
              <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Article Extract & Summary:
              </label>
              <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900/90 border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed max-h-52 sm:max-h-60 overflow-y-auto">
                {cleanSnippet(selectedArticle.content || selectedArticle.description) ||
                  'No extended excerpt was returned in the search snippet. Click the button below to view the full original article.'}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedArticle(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer text-center"
              >
                Close Details
              </button>

              <a
                href={selectedArticle.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-extrabold shadow-lg shadow-sky-500/25 transition-all cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Open Original News Article</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
