import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { VerificationResult } from '../types/verification';
import { VerdictBadge } from '../components/VerdictBadge';
import { 
  History as HistoryIcon, 
  Trash2, 
  ArrowRight, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  Search, 
  Download, 
  ShieldCheck, 
  FileText 
} from 'lucide-react';

export const History: React.FC = () => {
  const [verifications, setVerifications] = useState<VerificationResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState<boolean>(true);
  const [clearing, setClearing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getHistory();
      setVerifications(data.verifications || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load saved history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Delete this verification record?')) return;
    try {
      await api.deleteVerification(id);
      setVerifications(prev => prev.filter(v => v.id !== id));
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to delete ALL saved verification history? This cannot be undone.')) return;
    try {
      setClearing(true);
      await api.clearHistory();
      setVerifications([]);
    } catch (err: any) {
      alert('Failed to clear history: ' + err.message);
    } finally {
      setClearing(false);
    }
  };

  const filteredVerifications = verifications.filter(v => {
    const q = searchQuery.toLowerCase();
    return (
      (v.claim && v.claim.toLowerCase().includes(q)) ||
      (v.category && v.category.toLowerCase().includes(q)) ||
      (v.verdict && v.verdict.toLowerCase().includes(q)) ||
      (v.input_date && v.input_date.includes(q))
    );
  });

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-6 sm:py-10 space-y-5 sm:space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2.5">
            <HistoryIcon className="w-5 h-5 sm:w-6 sm:h-6 text-sky-400" />
            Verification History
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
            All your analyzed news verifications are saved here. You can review or delete records at any time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {verifications.length > 0 && (
            <button
              onClick={handleClearAll}
              disabled={clearing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-rose-950/40 border border-rose-900/50 text-[11px] sm:text-xs font-bold text-rose-400 hover:bg-rose-900/60 hover:text-white transition-all cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{clearing ? 'Clearing...' : 'Clear All'}</span>
            </button>
          )}

          <button
            onClick={fetchHistory}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-900 border border-slate-800 text-[11px] sm:text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Search Filter Input */}
      {verifications.length > 0 && (
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search past verifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-800 focus:border-sky-500 rounded-xl sm:rounded-2xl pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500/30 transition-all"
          />
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
          <span className="text-xs font-semibold text-slate-400">Loading saved history...</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-900/40 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && verifications.length === 0 && (
        <div className="glass-panel rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center border-slate-800 space-y-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <h3 className="text-base font-bold text-white">No Saved Verifications Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Verify any news claim, article URL, or screenshot from the home page. Your completed reports will be safely saved here until you decide to remove them.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-extrabold shadow-lg shadow-sky-500/20 transition-all"
          >
            Verify a Claim Now
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Verifications List */}
      {!loading && !error && filteredVerifications.length > 0 && (
        <div className="space-y-3 sm:space-y-3.5">
          {filteredVerifications.map((item) => (
            <Link
              key={item.id}
              to={`/results/${item.id}`}
              className="block glass-panel rounded-2xl p-4 sm:p-5 border-slate-800/80 hover:border-sky-500/40 hover:bg-slate-900/80 transition-all group relative"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div className="space-y-2 flex-1 sm:pr-4">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60">
                      {item.category || 'General'}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {item.created_at?.slice(0, 10) || 'Date N/A'}
                    </span>
                    <span className="text-[10px] font-bold text-sky-400 font-mono">
                      Score: {item.evidence_score || 0}/100
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-slate-100 group-hover:text-sky-300 transition-colors line-clamp-2 leading-snug break-words">
                    "{item.claim}"
                  </h3>

                  {item.ai_report?.executive_summary && (
                    <p className="text-[11px] sm:text-xs text-slate-400 line-clamp-1">
                      {item.ai_report.executive_summary}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t border-slate-800/50 sm:border-0">
                  <VerdictBadge verdict={item.verdict} size="sm" />
                  
                  <div className="flex items-center gap-2">
                    {/* Delete button */}
                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      className="p-1.5 sm:p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-900/50 hover:bg-rose-950/20 transition-all cursor-pointer"
                      title="Delete verification"
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>

                    <div className="w-7 h-7 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-slate-400 group-hover:text-sky-300 group-hover:border-sky-500/40 transition-colors">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
