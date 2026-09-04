import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Results } from './pages/Results';
import { History } from './pages/History';

export const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-sky-500 selection:text-white">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/results/:id" element={<Results />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </main>
        <footer className="border-t border-slate-800/60 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>TruthLens • AI-Powered News Verification & Misinformation Detection</span>
            <span>Evidence-Based Fact Checking</span>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;
