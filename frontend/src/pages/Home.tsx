import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { CustomDatePicker } from '../components/CustomDatePicker';
import { 
  Sparkles, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  FileText, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  Calendar,
  Scan,
  X,
  CheckCircle2,
  UploadCloud
} from 'lucide-react';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'text' | 'url' | 'image'>('text');
  
  const [claim, setClaim] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [url, setUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrSuccess, setOcrSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Manage image preview cleanup
  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  const handleImageChange = (file: File | null) => {
    setImageFile(file);
    setOcrSuccess(null);
    setError(null);
  };

  const handleScanImageOcr = async () => {
    if (!imageFile) {
      setError('Please select or drop an image file first.');
      return;
    }
    try {
      setOcrLoading(true);
      setError(null);
      const formData = new FormData();
      formData.append('file', imageFile);

      const res = await api.extractImage(formData);
      if (res.extracted_claim) {
        setClaim(res.extracted_claim);
        if (res.detected_date) {
          setDate(res.detected_date);
        }
        setOcrSuccess(`Successfully extracted news text via ${res.engine || 'Vision OCR'}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to extract text from image. Please enter the claim manually.');
    } finally {
      setOcrLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!date) {
      setError('Date associated with the event is required.');
      return;
    }

    try {
      setLoading(true);
      let result;

      if (mode === 'text') {
        if (!claim.trim() || claim.trim().length < 5) {
          setError('Please enter a claim statement (at least 5 characters).');
          setLoading(false);
          return;
        }
        setLoadingStep('Retrieving multi-source evidence...');
        result = await api.verifyClaim({ claim: claim.trim(), date });
      } else if (mode === 'url') {
        if (!url.trim()) {
          setError('Please provide a valid article URL.');
          setLoading(false);
          return;
        }
        setLoadingStep('Extracting content and retrieving facts...');
        const formData = new FormData();
        formData.append('url', url.trim());
        formData.append('date', date);
        result = await api.verifyUrl(formData);
      } else if (mode === 'image') {
        // If the user already extracted and reviewed the claim into the textarea, verify that claim directly
        if (claim.trim() && claim.trim().length >= 5) {
          setLoadingStep('Verifying extracted news claim...');
          result = await api.verifyClaim({ claim: claim.trim(), date });
        } else {
          if (!imageFile) {
            setError('Please upload a screenshot or image containing the news claim.');
            setLoading(false);
            return;
          }
          setLoadingStep('Scanning image with Vision OCR and verifying facts...');
          const formData = new FormData();
          formData.append('file', imageFile);
          formData.append('date', date);
          result = await api.verifyImage(formData);
        }
      }

      if (result && result.id) {
        navigate(`/results/${result.id}`);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during verification.');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-14 md:py-20">
      {/* Hero Header */}
      <div className="text-center space-y-4 sm:space-y-5 mb-8 sm:mb-12">
        <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight px-2">
          Verify News with <span className="bg-gradient-to-r from-sky-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">Multi-Source Facts</span>
        </h1>

        <p className="text-xs sm:text-sm md:text-base lg:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed px-2">
          TruthLens retrieves real articles from multiple independent sources, checks dates, classifies source credibility, calculates an explainable 0–100 Evidence Score, and provides grounded reports.
        </p>
      </div>

      {/* Main Verification Card */}
      <div className="glass-panel rounded-2xl sm:rounded-3xl p-4 sm:p-8 md:p-10 border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Mode Selector Tabs */}
        <div className="flex items-center justify-center gap-1.5 p-1 bg-slate-900/90 rounded-xl sm:rounded-2xl border border-slate-800 mb-5 sm:mb-6 max-w-md mx-auto">
          {[
            { id: 'text', label: 'News Claim', icon: FileText },
            { id: 'url', label: 'Article URL', icon: LinkIcon },
            { id: 'image', label: 'Image / OCR', icon: ImageIcon },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSel = mode === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMode(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 sm:px-3 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                  isSel
                    ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="mb-5 sm:mb-6 p-3.5 sm:p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-6">
          {/* Text Mode */}
          {mode === 'text' && (
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                News Claim Statement <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={4}
                value={claim}
                onChange={(e) => setClaim(e.target.value)}
                placeholder="Enter the news headline or statement to verify (e.g., 'India lands Chandrayaan-3 on the Moon')..."
                className="w-full bg-slate-900/80 border border-slate-700/80 rounded-2xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all leading-relaxed"
                required
              />
            </div>
          )}

          {/* URL Mode */}
          {mode === 'url' && (
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Article Web Address (URL) <span className="text-rose-400">*</span>
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/news-article-headline"
                className="w-full bg-slate-900/80 border border-slate-700/80 rounded-2xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-all"
                required
              />
              <p className="text-[11px] text-slate-500">
                We extract article text directly without storing your personal data.
              </p>
            </div>
          )}

          {/* Image / OCR Mode */}
          {mode === 'image' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Screenshot, Headline, or News Image <span className="text-rose-400">*</span>
                </label>

                {!imagePreview ? (
                  <div className="border-2 border-dashed border-slate-700 hover:border-sky-500/60 rounded-2xl p-6 sm:p-8 text-center bg-slate-900/40 hover:bg-slate-900/60 transition-all">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e.target.files?.[0] || null)}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer block space-y-3">
                      <div className="w-12 h-12 mx-auto rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shadow-lg shadow-sky-500/10">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-slate-200 block">
                        Click to upload or drag & drop image screenshot
                      </span>
                      <span className="text-[11px] text-slate-400 block max-w-sm mx-auto">
                        Supports PNG, JPG, WEBP screenshots of news articles, tweets, TV chyrons, or newspaper clippings.
                      </span>
                    </label>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700/80 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <img 
                          src={imagePreview} 
                          alt="Uploaded news preview" 
                          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border border-slate-700 shadow-md shrink-0" 
                        />
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-slate-200 truncate">
                            {imageFile?.name}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {(imageFile ? (imageFile.size / 1024).toFixed(1) : 0)} KB • Ready for Vision OCR
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleScanImageOcr}
                          disabled={ocrLoading}
                          className="px-3 py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {ocrLoading ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Scanning...</span>
                            </>
                          ) : (
                            <>
                              <Scan className="w-3.5 h-3.5" />
                              <span>Scan Text</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleImageChange(null)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700 transition-colors cursor-pointer"
                          title="Remove image"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {ocrSuccess && (
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                        <span>{ocrSuccess}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Extracted Claim Textarea (always visible in Image mode so user can see/edit OCR output) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                    Extracted News Claim
                  </label>
                  {claim && (
                    <span className="text-[10px] text-sky-400 font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      OCR Claim Ready
                    </span>
                  )}
                </div>
                <textarea
                  rows={3}
                  value={claim}
                  onChange={(e) => setClaim(e.target.value)}
                  placeholder="The OCR news headline/claim extracted from your image will appear here, or you can click 'Scan Text' to preview and edit..."
                  className="w-full bg-slate-900/80 border border-slate-700/80 rounded-2xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* Mandatory Event Date */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-sky-400" />
              Event Associated Date <span className="text-rose-400">*</span>
            </label>
            <CustomDatePicker
              value={date}
              onChange={setDate}
              required
            />
            <span className="text-[10px] text-slate-500">
              Used to verify temporal consistency and detect recycled old news.
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-extrabold text-sm uppercase tracking-wider shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{loadingStep || 'Retrieving & Verifying Evidence...'}</span>
              </>
            ) : (
              <>
                <span>Verify News Claim</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

