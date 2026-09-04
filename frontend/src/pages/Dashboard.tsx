import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { DashboardStats } from '../types/verification';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie 
} from 'recharts';
import { BarChart3, Clock, AlertCircle, ShieldCheck, Activity, Award, RefreshCw } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getDashboard();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
        <p className="text-xs text-slate-400">Loading recent session statistics...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
        <p className="text-sm text-slate-300">{error || 'Failed to load statistics.'}</p>
        <button
          onClick={fetchStats}
          className="px-4 py-2 rounded-xl bg-sky-500 text-white font-bold text-xs"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Transform verdict distribution data for chart
  const verdictColors: Record<string, string> = {
    LIKELY_TRUE: '#10b981',
    PARTIALLY_TRUE: '#14b8a6',
    MISLEADING: '#f59e0b',
    LIKELY_FALSE: '#f43f5e',
    UNVERIFIED: '#94a3b8',
    INSUFFICIENT_EVIDENCE: '#6366f1'
  };

  const verdictData = Object.entries(stats.verdict_distribution).map(([key, count]) => ({
    name: key.replace('_', ' '),
    count,
    color: verdictColors[key] || '#38bdf8'
  }));

  const scoreData = Object.entries(stats.score_distribution).map(([bracket, count]) => ({
    bracket,
    count
  }));

  const categoryData = Object.entries(stats.category_distribution).map(([cat, count]) => ({
    category: cat,
    count
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-sky-400" />
            Verification Analytics Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Aggregate distributions and evidence scores computed over non-expired session records.
          </p>
        </div>

        <button
          onClick={fetchStats}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-all self-start cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Stats
        </button>
      </div>

      {/* Required Ephemeral Notice Banner (Section 3) */}
      <div className="p-4 rounded-2xl bg-sky-950/30 border border-sky-800/40 text-sky-200 text-xs flex items-center gap-3">
        <Clock className="w-5 h-5 text-sky-400 shrink-0" />
        <div>
          <span className="font-bold block">20-Minute Ephemeral Window Notice</span>
          <p className="text-sky-300/80 mt-0.5 leading-relaxed">
            {stats.is_recent_only_notice} All metrics are computed dynamically over active documents currently within the {stats.retention_window_minutes}-minute TTL working retention period.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel rounded-2xl p-5 border-slate-800">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-sky-400" />
            Active Verifications
          </span>
          <div className="text-3xl font-extrabold text-white mt-2">
            {stats.total_active_verifications}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">In 20-min working storage</span>
        </div>

        <div className="glass-panel rounded-2xl p-5 border-slate-800">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <Award className="w-4 h-4 text-emerald-400" />
            Avg Evidence Score
          </span>
          <div className="text-3xl font-extrabold text-emerald-400 mt-2">
            {stats.average_evidence_score} <span className="text-sm font-semibold text-slate-500">/ 100</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Across active sessions</span>
        </div>

        <div className="glass-panel rounded-2xl p-5 border-slate-800">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-400" />
            TTL Expiry Window
          </span>
          <div className="text-3xl font-extrabold text-amber-400 mt-2">
            {stats.retention_window_minutes} <span className="text-sm font-semibold text-slate-500">mins</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Automatic MongoDB cleanup</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Verdict Distribution */}
        <div className="glass-panel rounded-2xl p-6 border-slate-800">
          <h3 className="font-bold text-sm text-slate-200 mb-4">Verdict Classification Distribution</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={verdictData}>
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} angle={-15} textAnchor="end" height={40} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} 
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {verdictData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Evidence Score Distribution */}
        <div className="glass-panel rounded-2xl p-6 border-slate-800">
          <h3 className="font-bold text-sm text-slate-200 mb-4">Evidence Score Distribution (0–100)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreData}>
                <XAxis dataKey="bracket" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} 
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Bar dataKey="count" fill="#38bdf8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
