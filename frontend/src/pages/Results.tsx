import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { VerificationResult } from '../types/verification';
import { api } from '../services/api';
import { VerdictBadge } from '../components/VerdictBadge';
import { ScoreGauge } from '../components/ScoreGauge';
import { KeyEvidenceCards } from '../components/KeyEvidenceCards';
import { SourceList } from '../components/SourceList';
import { DateAnalysisPanel } from '../components/DateAnalysisPanel';
import { TimelineView } from '../components/TimelineView';
import { FullAIReport } from '../components/FullAIReport';
import { 
  Download, 
  ArrowLeft, 
  Clock, 
  RefreshCw, 
  AlertCircle, 
  Share2, 
  Check, 
  Sparkles,
  FileCheck2,
  Trash2
} from 'lucide-react';

export const Results: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getVerification(id);
        setVerification(data);
      } catch (err: any) {
        setError(err.message || 'Verification record not found or expired.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleDownloadPdf = async () => {
    if (!id) return;
    try {
      setDownloading(true);
      const blob = await api.downloadPdf(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `truthlens_report_${id.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert('Failed to download PDF report: ' + err.message);
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNewVerification = () => {
    navigate('/');
  };

  const handleDeleteRecord = async () => {
    if (!id) return;
    const confirmDelete = window.confirm('Are you sure you want to delete this verification record? This action cannot be undone.');
    if (confirmDelete) {
      await api.deleteVerification(id);
      navigate('/history');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
        <p className="text-sm font-semibold text-slate-300">Retrieving multi-source verification analysis...</p>
      </div>
    );
  }

  if (error || !verification) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 sm:py-24 text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/5">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-white">Session Timed Out or Quota Limit</h2>
        <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
          {error?.includes('quota') || error?.includes('429')
            ? 'An AI model quota was temporarily exhausted. Secondary fallback models will automatically take over on your next attempt.'
            : 'The active verification session expired or an AI model rate limit occurred. Please try again to verify with remaining model credits.'}
        </p>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-sky-500/25 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Try Again / Verify New Claim
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-slate-800">
        <button
          onClick={handleNewVerification}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          Verify Another Claim
        </button>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-700 transition-all cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Share'}</span>
          </button>

          <button
            onClick={handleDeleteRecord}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-rose-900/40 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-all cursor-pointer"
            title="Delete this verification record"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Delete</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-sky-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {downloading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Progressive Disclosure Section 1: Main Claim & Big Verdict Badge */}
      <div className="glass-panel rounded-2xl sm:rounded-3xl p-4 sm:p-8 border-slate-800 space-y-4 sm:space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-sky-400 bg-sky-500/10 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full border border-sky-500/20">
            Category: {verification.category}
          </span>
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-400">
            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
            <span>Event Date: <b className="text-slate-200">{verification.input_date}</b></span>
          </div>
        </div>

        <h1 className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-white leading-snug break-words">
          "{verification.claim}"
        </h1>

        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <VerdictBadge verdict={verification.verdict} size="lg" />
          </div>

          <div className="text-[11px] sm:text-xs text-slate-400">
            Misinformation Classification: <span className="font-bold text-slate-200">{verification.misinformation_type}</span>
          </div>
        </div>
      </div>

      {/* Progressive Disclosure Section 2: 0-100 Score Gauge & Breakdown */}
      <ScoreGauge 
        score={verification.evidence_score} 
        breakdown={verification.score_breakdown} 
      />

      {/* Progressive Disclosure Section 3: Executive Summary */}
      {verification.ai_report?.executive_summary && (
        <div className="glass-panel rounded-2xl p-6 border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
            <FileCheck2 className="w-4 h-4 text-sky-400" />
            Executive Evidence Summary
          </h3>
          <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-normal">
            {verification.ai_report.executive_summary}
          </p>
        </div>
      )}

      {/* Progressive Disclosure Section 4: Key Supporting / Contradicting Evidence Cards */}
      <KeyEvidenceCards
        articles={verification.articles}
        supportingSummary={verification.ai_report?.supporting_evidence_summary}
        contradictingSummary={verification.ai_report?.contradicting_evidence_summary}
      />

      {/* Progressive Disclosure Section 5: Date Analysis & Old-News Detection Panel */}
      <DateAnalysisPanel dateAnalysis={verification.date_analysis} />

      {/* Progressive Disclosure Section 6: Full Discovered Source List */}
      <SourceList articles={verification.articles} />

      {/* Progressive Disclosure Section 7: Chronological Timeline */}
      <TimelineView timeline={verification.ai_report?.timeline} />

      {/* Progressive Disclosure Section 8: Structured AI Evidence Report */}
      <FullAIReport
        aiReport={verification.ai_report}
        extractedEntities={verification.extracted_entities}
        providerUsed={verification.llm_provider_used}
      />
    </div>
  );
};
