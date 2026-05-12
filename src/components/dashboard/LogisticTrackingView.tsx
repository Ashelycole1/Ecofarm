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
    <div className="absolute inset-0 bg-[#e8e0d0] flex items-center justify-center">
      <div className="text-gray-400 text-xs font-bold uppercase tracking-widest animate-pulse">Loading Map...</div>
    </div>
  )
});

export default function LogisticTrackingView() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
    // Outer wrapper: flex column so nav sits below the map, not on top
    <div className="flex flex-col" style={{ height: 'calc(100vh - 120px)', minHeight: 520 }}>
      
      {/* ─── Map + Sheet Area ─── */}
      <div className="relative flex-1 overflow-hidden rounded-3xl bg-[#f4f4f4]">
        
        {/* Map Background */}
        <div className="absolute inset-0 z-0">
          <MapComponent 
            currentPosition={[0.3476, 32.5825]}
            routeCoordinates={[]} 
          />
        </div>

        {/* Map Floating Buttons */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10 pointer-events-none">
          <button className="p-3 bg-white rounded-full shadow-lg pointer-events-auto active:scale-90 transition-transform">
            <User size={20} className="text-black" />
          </button>
          <div className="flex flex-col gap-2">
            <button className="p-3 bg-white rounded-full shadow-lg pointer-events-auto active:scale-90 transition-transform">
              <Bell size={20} className="text-black" />
            </button>
            <button className="p-3 bg-white rounded-full shadow-lg pointer-events-auto active:scale-90 transition-transform">
              <Navigation size={20} className="text-[#ff0050]" />
            </button>
          </div>
        </div>

        {/* ─── Bottom Sheet ─── */}
        <div 
          className={`absolute bottom-0 left-0 right-0 z-20 bg-white rounded-t-[28px] shadow-[0_-10px_40px_rgba(0,0,0,0.12)] transition-all duration-500 ease-out ${
            isSheetOpen ? 'h-[90%]' : 'h-[320px]'
          }`}
        >
          {/* Drag Handle */}
          <div 
            className="w-full flex justify-center py-3 cursor-pointer"
            onClick={() => setIsSheetOpen(!isSheetOpen)}
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full" />
          </div>

          <div className="px-5 overflow-y-auto scrollbar-hide" style={{ height: 'calc(100% - 32px)' }}>
            
            {/* Search Bar */}
            <div 
              className="flex items-center gap-3 bg-gray-100 p-3 rounded-full mb-5 cursor-pointer hover:bg-gray-200 transition-colors"
              onClick={() => setIsSheetOpen(true)}
            >
              <div className="w-9 h-9 bg-[#ff0050] rounded-full flex items-center justify-center shadow-md shadow-[#ff0050]/20 shrink-0">
                <Search size={18} className="text-white" />
              </div>
              <span className="text-gray-500 font-semibold text-base flex-1">Where to?</span>
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
                <Clock size={14} className="text-black" />
                <span className="text-black font-bold text-xs">Later</span>
              </div>
            </div>

            {/* Quick Shortcuts */}
            <div className="mb-6">
              <div className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-2xl transition-colors cursor-pointer group">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  <Home size={18} className="text-black" />
                </div>
                <div className="flex-1 border-b border-gray-100 pb-3">
                  <p className="font-bold text-black text-sm">Home</p>
                  <p className="text-gray-400 text-xs">Set home address</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-2xl transition-colors cursor-pointer group">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  <Briefcase size={18} className="text-black" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-black text-sm">Work</p>
                  <p className="text-gray-400 text-xs">Set work address</p>
                </div>
              </div>
            </div>

            {/* Promo Banner */}
            <div className="relative rounded-[20px] bg-[#d31c2d] p-5 overflow-hidden mb-5 cursor-pointer group">
              <div className="relative z-10 max-w-[58%]">
                <h3 className="text-white font-bold text-base leading-snug mb-3">
                  Book your first delivery with us now
                </h3>
                <button className="bg-[#5c131a] text-white px-4 py-2 rounded-full font-bold text-xs hover:bg-[#4a0f15] transition-colors">
                  Book now
                </button>
              </div>
              <div className="absolute bottom-0 right-0 opacity-20 transition-transform group-hover:scale-110 duration-500">
                <Truck size={100} className="text-white -rotate-6 translate-x-4 translate-y-2" />
              </div>
            </div>

            {/* Service Grid */}
            <div className="grid grid-cols-2 gap-3 pb-6">
              <div className="bg-gray-50 p-4 rounded-[18px] flex flex-col gap-2 hover:bg-gray-100 transition-colors cursor-pointer">
                <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <Bike size={22} className="text-[#ff0050]" />
                </div>
                <div>
                  <p className="font-bold text-black text-sm">Eco-Rider</p>
                  <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Fast & Agile</p>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-[18px] flex flex-col gap-2 hover:bg-gray-100 transition-colors cursor-pointer">
                <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <Truck size={22} className="text-[#ff0050]" />
                </div>
                <div>
                  <p className="font-bold text-black text-sm">Eco-Truck</p>
                  <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Heavy Loads</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ─── Bottom Navigation — OUTSIDE the map ─── */}
      <div className="bg-white border-t border-gray-100 px-6 pt-3 pb-4 flex justify-around items-center shadow-[0_-3px_15px_rgba(0,0,0,0.05)] shrink-0 rounded-b-3xl">
        <button className="flex flex-col items-center gap-1 text-[#ff0050]">
          <Home size={22} />
          <span className="text-[10px] font-bold">Home</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors">
          <History size={22} />
          <span className="text-[10px] font-bold">Trips</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors">
          <User size={22} />
          <span className="text-[10px] font-bold">Account</span>
        </button>
      </div>

    </div>
  );
}
