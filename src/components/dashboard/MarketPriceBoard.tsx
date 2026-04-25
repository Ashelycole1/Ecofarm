"use client";

import { useState, useEffect } from 'react';
import { TrendingUp, RefreshCw, WifiOff, Clock } from 'lucide-react';
import { mockMarketPrices } from '@/lib/gisData';
import { upsertMarketPrices, getLatestMarketPrices, type MarketPrice } from '@/lib/db';

const TREND_COLORS = { up: '#22C55E', down: '#EF4444', flat: '#9CA3AF' };

export default function MarketPriceBoard() {
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCached, setIsCached] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const on = () => { setIsOnline(true); loadPrices(true); };
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    loadPrices(navigator.onLine);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  const loadPrices = async (online: boolean) => {
    setLoading(true);
    if (online) {
      // In production this would fetch from Supabase; here we use mock + cache
      const withTimestamps = mockMarketPrices.map(p => ({
        ...p,
        timestamp: Date.now(),
      }));
      await upsertMarketPrices(withTimestamps);
      const cached = await getLatestMarketPrices();
      setPrices(cached.length > 0 ? cached : withTimestamps as any);
      setLastUpdated(new Date());
      setIsCached(false);
    } else {
      const cached = await getLatestMarketPrices();
      if (cached.length > 0) {
        setPrices(cached);
        setLastUpdated(new Date(cached[0].timestamp));
        setIsCached(true);
      } else {
        setPrices(mockMarketPrices as any);
        setIsCached(true);
      }
    }
    setLoading(false);
  };

  const formatUGX = (n: number) =>
    n >= 1000 ? `UGX ${(n / 1000).toFixed(1)}k` : `UGX ${n}`;

  const timeSince = (d: Date) => {
    const h = Math.floor((Date.now() - d.getTime()) / 3600000);
    if (h < 1) return 'Just now';
    if (h === 1) return '1h ago';
    return `${h}h ago`;
  };

  // Mock trend (random for demo)
  const getTrend = (cropId: string): 'up' | 'down' | 'flat' => {
    const h = cropId.charCodeAt(cropId.length - 1);
    return h % 3 === 0 ? 'up' : h % 3 === 1 ? 'down' : 'flat';
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
            <TrendingUp className="text-wheat" size={18} />
          </div>
          <div>
            <h3 className="text-white font-black text-sm">Market Price Board</h3>
            <p className="text-white/40 text-[9px] uppercase font-bold tracking-wider">
              {isCached ? '📴 Cached Prices' : '🟢 Live Prices'} · {lastUpdated ? timeSince(lastUpdated) : '—'}
            </p>
          </div>
        </div>
        <button
          onClick={() => loadPrices(isOnline)}
          disabled={loading}
          className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:bg-white/10 transition-all active:scale-95"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Offline Banner */}
      {!isOnline && (
        <div
          className="px-4 py-2 rounded-xl flex items-center gap-2"
          style={{ background: 'rgba(249,115,22,0.10)', border: '1px solid rgba(249,115,22,0.25)' }}
        >
          <WifiOff size={12} className="text-orange-400" />
          <p className="text-orange-400 text-[10px] font-bold">Offline — showing last cached prices</p>
        </div>
      )}

      {/* Price Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid rgba(61,138,129,0.15)' }}
      >
        {/* Table header */}
        <div
          className="grid grid-cols-4 px-4 py-2"
          style={{ background: 'rgba(45,102,95,0.25)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          {['Crop', 'Market', 'Price/kg', 'Trend'].map(h => (
            <p key={h} className="text-white/30 text-[8px] uppercase font-black">{h}</p>
          ))}
        </div>

        {/* Rows */}
        {prices.length === 0 && loading ? (
          <div className="py-8 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-forest/30 border-t-forest rounded-full animate-spin" />
          </div>
        ) : (
          prices.map((p, i) => {
            const trend = getTrend(p.cropId);
            return (
              <div
                key={i}
                className="grid grid-cols-4 px-4 py-3 items-center transition-colors hover:bg-white/[0.02]"
                style={{ borderBottom: i < prices.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
              >
                <p className="text-white text-xs font-bold truncate">{p.cropName}</p>
                <p className="text-white/40 text-[10px] truncate">{p.marketName}</p>
                <p className="text-wheat font-black text-[11px]">{formatUGX(p.pricePerKg)}</p>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-black" style={{ color: TREND_COLORS[trend] }}>
                    {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
                  </span>
                  {isCached && (
                    <Clock size={8} className="text-white/20" />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <p className="text-white/20 text-[9px] text-center font-bold">
        Prices in UGX/kg · Updated from Kampala markets
      </p>
    </div>
  );
}
