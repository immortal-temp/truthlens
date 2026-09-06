import React, { useEffect } from 'react';
import { 
  X, 
  FileText, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  Calendar, 
  ShieldCheck, 
  Scale, 
  FileDown, 
  Sparkles, 
  CheckCircle2,
  BookOpen,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';

interface HowToUseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToUseModal: React.FC<HowToUseModalProps> = ({ isOpen, onClose }) => {
  // Close on Escape key press & prevent background scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-3xl my-8 bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl shadow-black/80 text-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 sm:py-5 border-b border-slate-800 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/25 text-sky-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                How to Use TruthLens
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400">
                AI-Powered Multi-Source News Verification Guide
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Close Guide (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6 sm:space-y-7 text-xs sm:text-sm leading-relaxed">
          
          {/* Section 1: Overview */}
          <div className="p-4 rounded-2xl bg-sky-950/30 border border-sky-500/20 space-y-2">
            <h3 className="text-xs sm:text-sm font-bold text-sky-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-sky-400" />
              What is TruthLens?
            </h3>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              TruthLens is a fact-checking engine that retrieves live, independent reports from global and national news sources to evaluate statements, detect misattributed recycled news, and deliver an explainable <b>0–100 Evidence Score</b> with grounded verdicts.
            </p>
          </div>

          {/* Section 2: Input Modes */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-sky-400" />
              1. Choose Your Verification Input Mode
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Text Mode */}
              <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-sky-400 font-bold text-xs sm:text-sm">
                  <FileText className="w-4 h-4" />
                  <span>News Claim</span>
                </div>
                <p className="text-slate-400 text-[11px] sm:text-xs">
                  Type or paste any news headline, political statement, social media claim, or breaking news assertion.
                </p>
              </div>

              {/* URL Mode */}
              <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs sm:text-sm">
                  <LinkIcon className="w-4 h-4" />
                  <span>Article URL</span>
                </div>
                <p className="text-slate-400 text-[11px] sm:text-xs">
                  Paste the full web link of an online news article. TruthLens automatically extracts the text and headline to verify.
                </p>
              </div>

              {/* Image / OCR Mode */}
              <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs sm:text-sm">
                  <ImageIcon className="w-4 h-4" />
                  <span>Image / OCR</span>
                </div>
                <p className="text-slate-400 text-[11px] sm:text-xs">
                  Upload screenshots of tweets, newspapers, TV chyrons, or articles. Vision OCR transcribes and extracts the headline statement.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Event Date */}
          <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-2">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Event Associated Date (Mandatory)</span>
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Always select or verify the date when the claimed event supposedly took place. TruthLens uses this date to detect <b>recycled old news</b> (e.g. an authentic 2020 event falsely reshared as happening today).
            </p>
          </div>

          {/* Section 4: What All TruthLens Gives & Includes */}
          <div className="space-y-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              2. What's Included in Your Verification Report
            </h3>

            <div className="space-y-3">
              {/* Verdict & Score */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start gap-3.5">
                <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 shrink-0 mt-0.5">
                  <Scale className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-100 text-xs sm:text-sm">Verdict & 0–100 Evidence Score</h4>
                  <p className="text-slate-400 text-[11px] sm:text-xs leading-relaxed">
                    Clear verdict classification (<em>Likely True</em>, <em>Partially True</em>, <em>Misleading</em>, <em>Likely False</em>, <em>Unverified</em>) backed by a transparent 6-factor score gauge measuring source agreement, date consistency, semantic similarity, publisher quality, and contradiction penalties.
                  </p>
                </div>
              </div>

              {/* Supporting Corroboration */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/60 border border-emerald-500/20 flex items-start gap-3.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-100 text-xs sm:text-sm flex items-center gap-2">
                    <span>Supporting Corroboration</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">Direct Links</span>
                  </h4>
                  <p className="text-slate-400 text-[11px] sm:text-xs leading-relaxed">
                    Shows independent media reporting confirming the claim details with <b>direct links to supporting news reports</b> from different publishers so you can click and verify the news on site.
                  </p>
                </div>
              </div>

              {/* Contradicting / Debunks */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/60 border border-rose-500/20 flex items-start gap-3.5">
                <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-100 text-xs sm:text-sm">Contradicting / Debunks</h4>
                  <p className="text-slate-400 text-[11px] sm:text-xs leading-relaxed">
                    Displays any conflicting reports, fact-checks, or refutations from reputable debunker outlets with direct links to the debunking articles whenever misinformation is detected.
                  </p>
                </div>
              </div>

              {/* Discovered Sources & Evidence */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start gap-3.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0 mt-0.5">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-100 text-xs sm:text-sm">Discovered Sources & Evidence</h4>
                  <p className="text-slate-400 text-[11px] sm:text-xs leading-relaxed">
                    Full list of all discovered web news articles indexed during the verification, including source credibility ratings (High/Medium/Regional), search/filter tools, and direct external links to original publisher articles.
                  </p>
                </div>
              </div>

              {/* Chronological Event Timeline */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start gap-3.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0 mt-0.5">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-100 text-xs sm:text-sm">Chronological Event Timeline</h4>
                  <p className="text-slate-400 text-[11px] sm:text-xs leading-relaxed">
                    Maps out the sequence of events as they unfolded across different news outlets over time, making it easy to see when a story first broke and how reporting evolved.
                  </p>
                </div>
              </div>

              {/* Structured AI Evidence Analysis */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start gap-3.5">
                <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 shrink-0 mt-0.5">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-100 text-xs sm:text-sm">Structured AI Evidence Analysis</h4>
                  <p className="text-slate-400 text-[11px] sm:text-xs leading-relaxed">
                    Entity and factual breakdown strictly synthesized from retrieved articles (zero invented facts) — highlighting key people, involved organizations, locations, important numbers/amounts, and an executive summary.
                  </p>
                </div>
              </div>

              {/* Downloadable PDF & History */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start gap-3.5">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                  <FileDown className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-100 text-xs sm:text-sm">1-Click PDF Report & History</h4>
                  <p className="text-slate-400 text-[11px] sm:text-xs leading-relaxed">
                    Download complete audit-ready verification PDF reports for offline sharing or citation, and access your previous verifications anytime via the History tab.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Best Practices */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Tips for Best Results
            </h3>
            <ul className="list-disc list-inside text-slate-400 text-xs space-y-1">
              <li>Keep the claim specific and focused on a single factual assertion (e.g., who did what and where).</li>
              <li>When uploading images, ensure the headline or key text in the screenshot is clear and readable.</li>
              <li>Always check the supporting sources to read full articles from primary publishers.</li>
            </ul>
          </div>
        </div>

        {/* Footer Action */}
        <div className="px-5 sm:px-7 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-sky-500/20 transition-all cursor-pointer text-center"
          >
            Got It, Let's Verify
          </button>
        </div>
      </div>
    </div>
  );
};
