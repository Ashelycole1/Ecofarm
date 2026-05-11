"use client";

import { useState, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Sparkles, RefreshCw, CheckCircle2, AlertTriangle, Droplets, ChevronDown } from 'lucide-react';
import type { AIReportTag } from '@/lib/db';

const LANGUAGES = [
  { code: 'English',  label: 'English',  flag: '🇬🇧' },
  { code: 'Luganda',  label: 'Luganda',  flag: '🇺🇬' },
  { code: 'Swahili',  label: 'Kiswahili', flag: '🌍' },
  { code: 'Acholi',   label: 'Acholi',   flag: '🇺🇬' },
];

const TAG_STYLES: Record<AIReportTag, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
  'Healthy':           { color: '#22C55E', bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.35)',  icon: <CheckCircle2 size={14} /> },
  'Pest Risk':         { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)', icon: <AlertTriangle size={14} /> },
  'Irrigation Needed': { color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.35)', icon: <Droplets size={14} /> },
  'Analyzing...':      { color: '#9CA3AF', bg: 'rgba(156,163,175,0.10)', border: 'rgba(156,163,175,0.25)', icon: <RefreshCw size={14} className="animate-spin" /> },
};

interface AnalysisResult {
  tag: AIReportTag;
  advice: string;
  confidence: number;
}

export default function CropInsightEngine() {
  const [ph, setPh] = useState(6.5);
  const [rainfall, setRainfall] = useState(45);
  const [nitrogen, setNitrogen] = useState(50);
  const [notes, setNotes] = useState('');
  const [language, setLanguage] = useState('English');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');
      const model = genAI.getGenerativeModel({
        model: 'models/gemini-1.5-flash',
        systemInstruction: `You are an expert agronomist for Ugandan smallholder farmers.
Analyze the farm report and return ONLY a valid JSON object with no markdown:
{ "tag": "Healthy" | "Pest Risk" | "Irrigation Needed", "advice": "string", "confidence": 0-100 }
The advice must be in ${language}. Keep advice under 80 words, practical and actionable.`,
      });

      const prompt = `Farm Report:
- Soil pH: ${ph}
- Rainfall this week: ${rainfall}mm
- Nitrogen level: ${nitrogen} ppm
- Farmer notes: "${notes || 'No additional notes.'}"
Analyze and classify this report.`;

      const resp = await model.generateContent(prompt);
      const raw = resp.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed: AnalysisResult = JSON.parse(raw);
      setResult(parsed);
    } catch (e: any) {
      setError('AI analysis failed. Check your Gemini API key.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const tag = result?.tag ?? (loading ? 'Analyzing...' : null);
  const tagStyle = tag ? TAG_STYLES[tag as AIReportTag] : null;
  const selectedLang = LANGUAGES.find(l => l.code === language)!;

  return (
    <div
      className="p-5 rounded-3xl space-y-5"
      style={{
        background: 'linear-gradient(145deg, rgba(45,102,95,0.25) 0%, rgba(13,36,34,0.85) 100%)',
        border: '1px solid rgba(61,138,129,0.2)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-forest/30 border border-white/10">
            <Sparkles className="text-wheat" size={18} />
          </div>
          <div>
            <h3 className="text-white font-black text-sm">AI Crop Insight Engine</h3>
            <p className="text-white/40 text-[9px] uppercase font-bold tracking-wide">Powered by Gemini 2.0</p>
          </div>
        </div>

        {/* Language selector */}
        <div className="relative">
          <button
            onClick={() => setShowLangMenu(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white text-[10px] font-bold"
          >
            <span>{selectedLang.flag}</span>
            <span>{selectedLang.label}</span>
            <ChevronDown size={10} />
          </button>
          {showLangMenu && (
            <div
              className="absolute right-0 top-full mt-1 z-50 rounded-xl overflow-hidden shadow-2xl"
              style={{ background: 'rgba(13,36,34,0.98)', border: '1px solid rgba(61,138,129,0.3)', minWidth: '130px' }}
            >
              {LANGUAGES.map(l => (
                <button
                  key={l.code}
                  onClick={() => { setLanguage(l.code); setShowLangMenu(false); }}
                  className="w-full text-left px-3 py-2 text-[11px] font-bold hover:bg-white/5 transition-colors flex items-center gap-2"
                  style={{ color: l.code === language ? '#F2C94C' : 'rgba(255,255,255,0.6)' }}
                >
                  {l.flag} {l.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sliders */}
      <div className="space-y-4">
        {[
          { label: 'Soil pH', value: ph, min: 3.5, max: 8.5, step: 0.1, unit: '', color: '#22C55E', set: setPh, fmt: (v: number) => v.toFixed(1) },
          { label: 'Rainfall', value: rainfall, min: 0, max: 200, step: 5, unit: 'mm', color: '#3B82F6', set: setRainfall, fmt: (v: number) => `${v}` },
          { label: 'Nitrogen', value: nitrogen, min: 0, max: 150, step: 5, unit: 'ppm', color: '#F59E0B', set: setNitrogen, fmt: (v: number) => `${v}` },
        ].map(({ label, value, min, max, step, unit, color, set, fmt }) => (
          <div key={label}>
            <div className="flex justify-between mb-1.5">
              <span className="text-white/60 text-[10px] font-bold uppercase">{label}</span>
              <span className="font-black text-[11px]" style={{ color }}>{fmt(value)}{unit}</span>
            </div>
            <input
              type="range" min={min} max={max} step={step} value={value}
              onChange={e => set(parseFloat(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${color} 0%, ${color} ${((value - min) / (max - min)) * 100}%, rgba(255,255,255,0.1) ${((value - min) / (max - min)) * 100}%, rgba(255,255,255,0.1) 100%)`,
              }}
            />
          </div>
        ))}
      </div>

      {/* Notes */}
      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Farmer observations (e.g. 'Leaves turning yellow at tips...')"
        rows={2}
        className="w-full bg-black/25 border border-white/10 rounded-xl px-3 py-2 text-white text-xs placeholder:text-white/25 resize-none outline-none focus:border-forest/50 transition-colors"
      />

      {/* Analyze Button */}
      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase transition-all active:scale-95 disabled:opacity-60"
        style={{
          background: loading ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#2D665F 0%,#1A3E3A 100%)',
          color: '#F2C94C',
          border: '1px solid rgba(242,201,76,0.2)',
          boxShadow: loading ? 'none' : '0 4px 20px rgba(45,102,95,0.4)',
        }}
      >
        {loading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
        {loading ? 'Analyzing Farm Data...' : 'Analyze with AI'}
      </button>

      {/* Result */}
      {(result || loading) && tagStyle && (
        <div
          className="p-4 rounded-2xl animate-fade-in space-y-3"
          style={{ background: tagStyle.bg, border: `1px solid ${tagStyle.border}` }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2" style={{ color: tagStyle.color }}>
              {tagStyle.icon}
              <span className="font-black text-sm">{tag}</span>
            </div>
            {result && (
              <span className="text-[9px] font-black uppercase" style={{ color: tagStyle.color, opacity: 0.7 }}>
                {result.confidence}% confidence
              </span>
            )}
          </div>
          {result && (
            <p className="text-white/80 text-xs leading-relaxed">{result.advice}</p>
          )}
        </div>
      )}

      {error && (
        <p className="text-red-400 text-xs text-center animate-fade-in">{error}</p>
      )}
    </div>
  );
}
