import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, Plus, History as HistoryIcon } from 'lucide-react';

export const Navbar: React.FC = () => {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-[#090d16] shadow-md shadow-black/30">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 p-0.5 shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-white">TruthLens</span>
            </div>
            <p className="hidden sm:block text-[10px] text-slate-400 -mt-0.5">Evidence-Based News Verification</p>
          </div>
        </Link>

        {/* Navigation & Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/history"
            className={`flex items-center gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              location.pathname === '/history'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800'
            }`}
            title="Verification History"
          >
            <HistoryIcon className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline">History</span>
          </Link>

          {location.pathname !== '/' && (
            <Link
              to="/"
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-sky-500/20 transition-all shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Verify Claim</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
