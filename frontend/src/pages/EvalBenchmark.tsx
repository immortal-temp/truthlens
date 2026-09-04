import React, { useState } from 'react';
import { api } from '../services/api';
import { FlaskConical, Play, RefreshCw, CheckCircle2, AlertTriangle, ShieldAlert, Award } from 'lucide-react';

export const EvalBenchmark: React.FC = () => {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runBenchmark = async () => {
    try {
      setRunning(true);
      setError(null);
      const data = await api.runEvaluation();
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'Benchmark run failed.');
    } finally {
      setRunning(false);
    }
  };

  const verdictClasses = [
    "LIKELY_TRUE", "PARTIALLY_TRUE", "MISLEADING",
    "LIKELY_FALSE", "UNVERIFIED", "INSUFFICIENT_EVIDENCE"
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <FlaskConical className="w-6 h-6 text-sky-400" />
            Gold-Set Evaluation Benchmark
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Validates algorithmic accuracy across a curated permanent dataset of ground-truth test claims.
          </p>
        </div>

        <button
          onClick={runBenchmark}
          disabled={running}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-sky-500/20 transition-all cursor-pointer disabled:opacity-50 self-start"
        >
          {running ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Evaluating Gold Set (40 Claims)...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>Run Benchmark Evaluation</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {!results && !running && (
        <div className="glass-panel rounded-3xl p-12 text-center space-y-4 border-slate-800 max-w-2xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mx-auto">
            <FlaskConical className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white">Curated Evaluation Suite Ready</h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
            Click the button above to execute the pipeline across 40 real-world benchmark claims spanning true news, fabricated hoaxes, old-news recycling, and ambiguous breaking stories.
          </p>
        </div>
      )}

      {results && (
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="glass-panel rounded-2xl p-5 border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Exact-Match Accuracy</span>
              <div className="text-3xl font-extrabold text-emerald-400 mt-1">
                {results.exact_match_accuracy_pct}%
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Strict 6-class verdict match</span>
            </div>

            <div className="glass-panel rounded-2xl p-5 border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Directional Accuracy</span>
              <div className="text-3xl font-extrabold text-sky-400 mt-1">
                {results.directional_accuracy_pct}%
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Broad True vs False consensus</span>
            </div>

            <div className="glass-panel rounded-2xl p-5 border-slate-800">
              <span className="text-xs text-slate-400 font-medium">False Insufficient Rate</span>
              <div className="text-3xl font-extrabold text-amber-400 mt-1">
                {results.false_insufficient_evidence_rate_pct}%
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">False negatives on clear claims</span>
            </div>

            <div className="glass-panel rounded-2xl p-5 border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Claims Evaluated</span>
              <div className="text-3xl font-extrabold text-white mt-1">
                {results.total_evaluated}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Curated gold benchmark set</span>
            </div>
          </div>

          {/* Mean Evidence Score By Ground Truth */}
          <div className="glass-panel rounded-2xl p-6 border-slate-800">
            <h3 className="font-bold text-sm text-slate-200 mb-3">Mean Evidence Score by Ground-Truth Label</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {Object.entries(results.mean_evidence_score_by_ground_truth || {}).map(([gt, sc]: any) => (
                <div key={gt} className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 font-bold block truncate">{gt.replace('_', ' ')}</span>
                  <span className="text-lg font-extrabold text-slate-100 mt-1 block">{sc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Confusion Matrix Table */}
          <div className="glass-panel rounded-2xl p-6 border-slate-800 overflow-x-auto">
            <h3 className="font-bold text-sm text-slate-200 mb-4">6x6 Verdict Confusion Matrix</h3>
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="p-2.5 font-bold">Ground Truth \ Predicted</th>
                  {verdictClasses.map(vc => (
                    <th key={vc} className="p-2.5 font-bold text-center">{vc.slice(0, 7)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {verdictClasses.map(gt => (
                  <tr key={gt} className="border-b border-slate-800/60 hover:bg-slate-900/40">
                    <td className="p-2.5 font-bold text-slate-300">{gt}</td>
                    {verdictClasses.map(pred => {
                      const count = results.confusion_matrix?.[gt]?.[pred] || 0;
                      const isDiagonal = gt === pred;
                      return (
                        <td 
                          key={pred} 
                          className={`p-2.5 text-center font-mono ${
                            isDiagonal && count > 0 
                              ? 'bg-emerald-500/15 text-emerald-400 font-bold' 
                              : count > 0 
                              ? 'bg-rose-500/10 text-rose-300' 
                              : 'text-slate-600'
                          }`}
                        >
                          {count}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
