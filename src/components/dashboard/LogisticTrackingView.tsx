"use client";

import { useState } from 'react';
import { 
  MapPin, 
  Navigation, 
  Truck, 
  Search, 
  Home, 
  Briefcase, 
  Clock, 
  History, 
  User,
  Bike,
  Car,
  Bell
} from 'lucide-react';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-bone-low flex items-center justify-center">
      <div className="text-ink-faint font-body text-xs font-bold uppercase tracking-widest animate-pulse">Loading Map...</div>
    </div>
  )
});

export default function LogisticTrackingView() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
    <div className="flex flex-col pb-6" style={{ height: 'calc(100vh - 120px)', minHeight: 520 }}>
      
      {/* ─── Map + Sheet Area ─── */}
      <div className="relative flex-1 overflow-hidden rounded-2xl bg-bone-low border border-border-soft shadow-card-sm">
        
        {/* Map Background */}
        <div className="absolute inset-0 z-0">
          <MapComponent 
            currentPosition={[0.3476, 32.5825]}
            routeCoordinates={[]} 
          />
        </div>

        {/* Map Floating Buttons */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10 pointer-events-none">
          <button className="p-3 bg-white rounded-full shadow-sm border border-border-soft pointer-events-auto active:scale-95 transition-transform text-ink hover:text-forest">
            <User size={18} />
          </button>
          <div className="flex flex-col gap-2">
            <button className="p-3 bg-white rounded-full shadow-sm border border-border-soft pointer-events-auto active:scale-95 transition-transform text-ink hover:text-forest">
              <Bell size={18} />
            </button>
            <button className="p-3 bg-white rounded-full shadow-sm border border-border-soft pointer-events-auto active:scale-95 transition-transform text-sienna">
              <Navigation size={18} />
            </button>
          </div>
        </div>

        {/* ─── Bottom Sheet ─── */}
        <div 
          className={`absolute bottom-0 left-0 right-0 z-20 bg-white rounded-t-3xl border-t border-border-soft shadow-xl transition-all duration-500 ease-out ${
            isSheetOpen ? 'h-[90%]' : 'h-[320px]'
          }`}
        >
          {/* Drag Handle */}
          <div 
            className="w-full flex justify-center py-3 cursor-pointer"
            onClick={() => setIsSheetOpen(!isSheetOpen)}
          >
            <div className="w-12 h-1 bg-border-soft rounded-full" />
          </div>

          <div className="px-6 overflow-y-auto scrollbar-hide" style={{ height: 'calc(100% - 32px)' }}>
            
            {/* Search Bar */}
            <div 
              className="flex items-center gap-3 bg-bone-low border border-border-soft p-3 rounded-full mb-5 cursor-pointer hover:bg-bone transition-colors shadow-inner"
              onClick={() => setIsSheetOpen(true)}
            >
              <div className="w-8 h-8 bg-forest rounded-full flex items-center justify-center shrink-0 text-white shadow-sm">
                <Search size={14} />
              </div>
              <span className="text-ink font-body text-xs font-bold flex-1">Where to?</span>
              <div className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-full border border-border-soft shadow-sm">
                <Clock size={12} className="text-ink-muted" />
                <span className="text-ink font-body font-bold text-[10px]">Later</span>
              </div>
            </div>

            {/* Quick Shortcuts */}
            <div className="mb-5 space-y-1">
              <div className="flex items-center gap-3 p-2.5 hover:bg-bone-low rounded-xl transition-colors cursor-pointer group">
                <div className="w-9 h-9 rounded-full bg-bone-low border border-border-soft flex items-center justify-center shrink-0 text-ink-muted group-hover:text-ink">
                  <Home size={16} />
                </div>
                <div className="flex-1 border-b border-border-soft pb-2.5">
                  <p className="font-body font-bold text-ink text-xs leading-tight">Home</p>
                  <p className="font-body text-[10px] text-ink-muted">Set home address</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2.5 hover:bg-bone-low rounded-xl transition-colors cursor-pointer group">
                <div className="w-9 h-9 rounded-full bg-bone-low border border-border-soft flex items-center justify-center shrink-0 text-ink-muted group-hover:text-ink">
                  <Briefcase size={16} />
                </div>
                <div className="flex-1">
                  <p className="font-body font-bold text-ink text-xs leading-tight">Work</p>
                  <p className="font-body text-[10px] text-ink-muted">Set work address</p>
                </div>
              </div>
            </div>

            {/* Promo Banner */}
            <div className="relative rounded-2xl bg-sienna p-5 overflow-hidden mb-5 cursor-pointer group shadow-sm text-white">
              <div className="relative z-10 max-w-[65%]">
                <h3 className="font-display font-bold text-lg leading-tight mb-2">
                  Book your first delivery with us now
                </h3>
                <button className="bg-white text-sienna px-3.5 py-1.5 rounded-full font-body font-bold text-[10px] hover:bg-bone-low transition-colors shadow-sm">
                  Book now
                </button>
              </div>
              <div className="absolute bottom-0 right-0 opacity-20 transition-transform group-hover:scale-105 duration-500">
                <Truck size={100} className="text-white -rotate-6 translate-x-4 translate-y-2" />
              </div>
            </div>

            {/* Service Grid */}
            <div className="grid grid-cols-2 gap-3 pb-6">
              <div className="bg-bone-low border border-border-soft p-4 rounded-xl flex flex-col gap-2 hover:bg-white transition-all cursor-pointer shadow-sm">
                <div className="w-9 h-9 bg-white rounded-lg border border-border-soft flex items-center justify-center text-sienna shadow-sm">
                  <Bike size={18} />
                </div>
                <div>
                  <p className="font-body font-bold text-ink text-xs">Eco-Rider</p>
                  <p className="font-body text-ink-muted text-[9px] uppercase font-bold tracking-wider mt-0.5">Fast & Agile</p>
                </div>
              </div>
              <div className="bg-bone-low border border-border-soft p-4 rounded-xl flex flex-col gap-2 hover:bg-white transition-all cursor-pointer shadow-sm">
                <div className="w-9 h-9 bg-white rounded-lg border border-border-soft flex items-center justify-center text-forest shadow-sm">
                  <Truck size={18} />
                </div>
                <div>
                  <p className="font-body font-bold text-ink text-xs">Eco-Truck</p>
                  <p className="font-body text-ink-muted text-[9px] uppercase font-bold tracking-wider mt-0.5">Heavy Loads</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ─── Bottom Navigation — OUTSIDE the map ─── */}
      <div className="bg-white border-t border-border-soft px-6 pt-3 pb-4 flex justify-around items-center shadow-card-sm shrink-0 rounded-b-2xl mt-0.5">
        <button className="flex flex-col items-center gap-0.5 text-forest">
          <Home size={18} />
          <span className="font-body text-[9px] font-bold tracking-wider">Home</span>
        </button>
        <button className="flex flex-col items-center gap-0.5 text-ink-muted hover:text-ink transition-colors">
          <History size={18} />
          <span className="font-body text-[9px] font-bold tracking-wider">Trips</span>
        </button>
        <button className="flex flex-col items-center gap-0.5 text-ink-muted hover:text-ink transition-colors">
          <User size={18} />
          <span className="font-body text-[9px] font-bold tracking-wider">Account</span>
        </button>
      </div>

    </div>
  );
}
