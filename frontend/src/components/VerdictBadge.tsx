import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, HelpCircle, AlertOctagon, Info } from 'lucide-react';

interface VerdictBadgeProps {
  verdict: 'LIKELY_TRUE' | 'PARTIALLY_TRUE' | 'MISLEADING' | 'LIKELY_FALSE' | 'UNVERIFIED' | 'INSUFFICIENT_EVIDENCE';
  size?: 'sm' | 'md' | 'lg';
}

export const VerdictBadge: React.FC<VerdictBadgeProps> = ({ verdict, size = 'md' }) => {
  const config = {
    LIKELY_TRUE: {
      label: 'Likely True',
      bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      glow: 'glow-true',
      icon: CheckCircle,
      desc: 'Strong multi-source corroboration and high credibility confirmation.'
    },
    PARTIALLY_TRUE: {
      label: 'Partially True',
      bg: 'bg-teal-500/10 border-teal-500/30 text-teal-300',
      glow: '',
      icon: Info,
      desc: 'Contains factual elements alongside minor inaccuracies or unconfirmed nuances.'
    },
    MISLEADING: {
      label: 'Misleading',
      bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
      glow: 'glow-misleading',
      icon: AlertTriangle,
      desc: 'Presents facts out of context, exaggerated, or old news reused as new.'
    },
    LIKELY_FALSE: {
      label: 'Likely False',
      bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
      glow: 'glow-false',
      icon: XCircle,
      desc: 'Directly contradicted by credible news sources or fact-checking debunks.'
    },
    UNVERIFIED: {
      label: 'Unverified',
      bg: 'bg-slate-500/10 border-slate-500/30 text-slate-300',
      glow: 'glow-unverified',
      icon: HelpCircle,
      desc: 'Reporting is ambiguous, speculative, or lacking authoritative confirmation.'
    },
    INSUFFICIENT_EVIDENCE: {
      label: 'Insufficient Evidence',
      bg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300',
      glow: '',
      icon: AlertOctagon,
      desc: 'Not enough public reporting found. System conservative policy avoids guessing.'
    }
  }[verdict] || {
    label: verdict,
    bg: 'bg-slate-500/10 border-slate-500/30 text-slate-300',
    glow: '',
    icon: HelpCircle,
    desc: 'Unclassified verdict.'
  };

  const Icon = config.icon;
  const sizeClasses = size === 'lg' 
    ? 'px-6 py-3 text-lg border-2' 
    : size === 'sm' 
    ? 'px-2.5 py-1 text-xs border' 
    : 'px-4 py-2 text-sm border';

  return (
    <div className={`inline-flex items-center gap-2.5 rounded-full font-bold uppercase tracking-wider backdrop-blur-md transition-all ${config.bg} ${config.glow} ${sizeClasses}`}>
      <Icon className={size === 'lg' ? 'w-6 h-6' : size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      <span>{config.label}</span>
    </div>
  );
};
