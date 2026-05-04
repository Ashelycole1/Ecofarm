"use client";

import { useState, useEffect } from 'react';
import { Leaf, RefreshCw, CheckCircle2, WifiOff, Wifi, ChevronDown } from 'lucide-react';
import { addSoilReport, getRecentSoilReports, type SoilReport } from '@/lib/db';

const FARMS = [
  { id: 'farm-001', name: 'Mukasa Organic Plantation' },
  { id: 'farm-002', name: 'Nakato Maize Cooperative' },
  { id: 'farm-003', name: 'Ssali Cassava Gardens' },
  { id: 'farm-004', name: 'Namirembe Beans Farm' },
  { id: 'farm-005', name: 'Kato Coffee Estate' },
];

const TAG_COLORS = {
  'Healthy':           '#22C55E',
  'Pest Risk':         '#F59E0B',
  'Irrigation Needed': '#3B82F6',
  'Analyzing...':      '#9CA3AF',
};

export default function SoilLogger() {
  const [farmId, setFarmId] = useState(FARMS[0].id);
  const [ph, setPh] = useState(6.5);
  const [moisture, setMoisture] = useState(55);
  const [nitrogen, setNitrogen] = useState(50);
  const [rainfall, setRainfall] = useState(30);
  const [notes, setNotes] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reports, setReports] = useState<SoilReport[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  const loadReports = async () => {
    const r = await getRecentSoilReports(5);
    setReports(r);
  };

  useEffect(() => { loadReports(); }, [saved]);

  const handleSave = async () => {
    setSaving(true);
    await addSoilReport({
      farmId,
      ph,
      moisture,
      nitrogen,
      rainfall_mm: rainfall,
      notes,
      timestamp: Date.now(),
      aiTag: 'Analyzing...',
      language: 'English',
    });

    // Register background sync if SW available
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const reg = await navigator.serviceWorker.ready;
        await (reg as any).sync.register('sync-soil-reports');
      } catch {}
    }

    setSaving(false);
    setSaved(true);
    setNotes('');
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div
        className="p-4 rounded-2xl flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg,rgba(45,102,95,0.30) 0%,rgba(13,36,34,0.80) 100%)', border: '1px solid rgba(61,138,129,0.2)' }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-forest/30 border border-white/10">
            <Leaf className="text-[#22C55E]" size={18} />
          </div>
          <div>
            <h3 className="text-white font-black text-sm">Soil Data Logger</h3>
            <p className="text-white/40 text-[9px] uppercase font-bold tracking-wider">Offline-First Field Tool</p>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${isOnline ? 'bg-green-500/15 text-green-400 border border-green-500/25' : 'bg-orange-500/15 text-orange-400 border border-orange-500/25'}`}>
          {isOnline ? <Wifi size={9} /> : <WifiOff size={9} />}
          {isOnline ? 'Online' : 'Offline'}
        </div>
      </div>

      {/* Farm Select */}
      <div>
        <label className="text-white/40 text-[9px] uppercase font-black block mb-1.5">Select Farm</label>
        <select
          value={farmId}
          onChange={e => setFarmId(e.target.value)}
          className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-white text-xs font-bold outline-none focus:border-forest/50 transition-colors appearance-none"
        >
          {FARMS.map(f => (
            <option key={f.id} value={f.id} className="bg-[#061412]">{f.name}</option>
          ))}
        </select>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Soil pH', value: ph, min: 3.5, max: 8.5, step: 0.1, color: '#22C55E', set: setPh, fmt: (v: number) => v.toFixed(1), unit: '' },
          { label: 'Moisture', value: moisture, min: 0, max: 100, step: 1, color: '#3B82F6', set: setMoisture, fmt: (v: number) => `${v}`, unit: '%' },
          { label: 'Nitrogen', value: nitrogen, min: 0, max: 150, step: 5, color: '#F59E0B', set: setNitrogen, fmt: (v: number) => `${v}`, unit: 'ppm' },
          { label: 'Rainfall', value: rainfall, min: 0, max: 200, step: 5, color: '#60A5FA', set: setRainfall, fmt: (v: number) => `${v}`, unit: 'mm' },
        ].map(({ label, value, min, max, step, color, set, fmt, unit }) => (
          <div
            key={label}
            className="p-3 rounded-xl space-y-2"
            style={{ background: `${color}10`, border: `1px solid ${color}25` }}
          >
            <div className="flex justify-between items-center">
              <span className="text-[9px] uppercase font-black" style={{ color }}>{label}</span>
              <span className="font-black text-xs text-white">{fmt(value)}{unit}</span>
            </div>
            <input
              type="range" min={min} max={max} step={step} value={value}
              onChange={e => set(parseFloat(e.target.value))}
              className="w-full h-1 rounded-full appearance-none cursor-pointer"
              style={{ background: `linear-gradient(to right, ${color} ${((value - min) / (max - min)) * 100}%, rgba(255,255,255,0.1) ${((value - min) / (max - min)) * 100}%)` }}
            />
          </div>
        ))}
      </div>

      {/* Notes */}
      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Field observations (optional)..."
        rows={2}
        className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white text-xs placeholder:text-white/20 resize-none outline-none focus:border-forest/50 transition-colors"
      />

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving || saved}
        className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase transition-all active:scale-95 disabled:opacity-60"
        style={{
          background: saved
            ? 'rgba(34,197,94,0.15)'
            : 'linear-gradient(135deg,#22C55E 0%,#16A34A 100%)',
          color: saved ? '#22C55E' : '#fff',
          border: saved ? '1px solid rgba(34,197,94,0.4)' : 'none',
          boxShadow: saved ? 'none' : '0 4px 20px rgba(34,197,94,0.3)',
        }}
      >
        {saving ? <RefreshCw size={14} className="animate-spin" /> : saved ? <CheckCircle2 size={14} /> : <Leaf size={14} />}
        {saving ? 'Saving...' : saved ? 'Saved Locally ✓' : isOnline ? 'Log Soil Data' : 'Save Offline'}
      </button>

      {!isOnline && (
        <p className="text-orange-400/70 text-[9px] text-center font-bold">
          📴 Data saved offline — will sync automatically when back online
        </p>
      )}

      {/* History Toggle */}
      <button
        onClick={() => { setShowHistory(v => !v); if (!showHistory) loadReports(); }}
        className="w-full py-2 text-white/30 text-[10px] font-bold flex items-center justify-center gap-1 hover:text-white/50 transition-colors"
      >
        <ChevronDown size={12} className={showHistory ? 'rotate-180 transition-transform' : 'transition-transform'} />
        {showHistory ? 'Hide' : 'View'} Recent Reports ({reports.length})
      </button>

      {showHistory && reports.length > 0 && (
        <div className="space-y-2 animate-fade-in">
          {reports.map((r, i) => {
            const tagColor = TAG_COLORS[r.aiTag as keyof typeof TAG_COLORS] ?? '#9CA3AF';
            return (
              <div
                key={i}
                className="p-3 rounded-xl flex items-center justify-between"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div>
                  <p className="text-white/60 text-[9px] font-black">pH {r.ph} · {r.moisture}% moisture</p>
                  <p className="text-white/30 text-[8px]">{new Date(r.timestamp).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  {r.aiTag && (
                    <span className="text-[8px] font-black px-2 py-0.5 rounded-full" style={{ color: tagColor, background: `${tagColor}15`, border: `1px solid ${tagColor}30` }}>
                      {r.aiTag}
                    </span>
                  )}
                  <div className={`w-1.5 h-1.5 rounded-full ${r.synced ? 'bg-green-400' : 'bg-orange-400'}`} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
