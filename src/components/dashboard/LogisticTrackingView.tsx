"use client";

import { useState, useEffect } from 'react';
import { 
  MapPin, 
  Navigation, 
  Truck, 
  Search, 
  Home, 
  Briefcase, 
  Clock, 
  ChevronRight, 
  History, 
  Wallet, 
  User,
  Plus,
  Bike,
  Car,
  Bell
} from 'lucide-react';
import dynamic from 'next/dynamic';
import Image from 'next/image';

const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-nature-gradient opacity-20 animate-pulse" />
});

export default function LogisticTrackingView() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="relative h-[92vh] w-full bg-[#f4f4f4] overflow-hidden">
      {/* ─── Top Map Layer ─── */}
      <div className="absolute inset-0 z-0">
        <MapComponent 
          currentPosition={[0.3476, 32.5825]} // Kampala Center
          routeCoordinates={[]} 
        />
        {/* Subtle Map Overlays */}
        <div className="absolute top-12 left-4 right-4 flex justify-between items-start pointer-events-none">
          <button className="p-3 bg-white rounded-full shadow-lg pointer-events-auto active:scale-90 transition-transform">
             <User size={20} className="text-black" />
          </button>
          <div className="flex flex-col gap-3">
            <button className="p-3 bg-white rounded-full shadow-lg pointer-events-auto active:scale-90 transition-transform">
               <Bell size={20} className="text-black" />
            </button>
            <button className="p-3 bg-white rounded-full shadow-lg pointer-events-auto active:scale-90 transition-transform">
               <Navigation size={20} className="text-[#ff0050]" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Bottom Sheet ─── */}
      <div 
        className={`absolute bottom-0 left-0 right-0 z-20 bg-white rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] transition-all duration-500 ease-out ${
          isSheetOpen ? 'h-[85%]' : 'h-[380px]'
        }`}
      >
        {/* Drag Handle */}
        <div 
          className="w-full flex justify-center py-3 cursor-grab active:cursor-grabbing"
          onClick={() => setIsSheetOpen(!isSheetOpen)}
        >
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="px-5 pb-10 overflow-y-auto h-full scrollbar-hide">
          {/* Search Bar - Freenow Style */}
          <div 
            className="flex items-center gap-3 bg-gray-100 p-4 rounded-full mb-6 cursor-pointer hover:bg-gray-200 transition-colors"
            onClick={() => setIsSheetOpen(true)}
          >
            <div className="w-10 h-10 bg-[#ff0050] rounded-full flex items-center justify-center shadow-lg shadow-[#ff0050]/20">
              <Search size={20} className="text-white" />
            </div>
            <span className="text-gray-500 font-semibold text-lg flex-1">Where to?</span>
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
              <Clock size={16} className="text-black" />
              <span className="text-black font-bold text-sm">Later</span>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="space-y-1 mb-8">
            <div className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-2xl transition-colors cursor-pointer group">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-white transition-colors">
                <Home size={20} className="text-black" />
              </div>
              <div className="flex-1 border-b border-gray-100 pb-3">
                <p className="font-bold text-black text-base">Home</p>
                <p className="text-gray-400 text-sm">Set home address</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-2xl transition-colors cursor-pointer group">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-white transition-colors">
                <Briefcase size={20} className="text-black" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-black text-base">Work</p>
                <p className="text-gray-400 text-sm">Set work address</p>
              </div>
            </div>
          </div>

          {/* Promo Banner */}
          <div className="relative rounded-[24px] bg-[#d31c2d] p-6 overflow-hidden mb-8 group cursor-pointer">
            <div className="relative z-10 max-w-[60%]">
              <h3 className="text-white font-bold text-xl leading-tight mb-4">
                Book your first delivery with us now
              </h3>
              <button className="bg-[#5c131a] text-white px-5 py-2.5 rounded-full font-bold text-sm hover:bg-[#4a0f15] transition-colors">
                Book now
              </button>
            </div>
            {/* Visual Element Placeholder */}
            <div className="absolute bottom-0 right-[-20px] w-[180px] h-[140px] opacity-90 transition-transform group-hover:scale-110 duration-500">
               <Truck size={120} className="text-white/20 absolute bottom-4 right-8 -rotate-12" />
               <Car size={80} className="text-white/40 absolute bottom-0 right-4" />
            </div>
          </div>

          {/* Service Grid (Optional Addition) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-[20px] flex flex-col gap-3 hover:bg-gray-100 transition-colors cursor-pointer">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                <Bike size={24} className="text-[#ff0050]" />
              </div>
              <div>
                <p className="font-bold text-black">Eco-Rider</p>
                <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Fast & Agile</p>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-[20px] flex flex-col gap-3 hover:bg-gray-100 transition-colors cursor-pointer">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                <Truck size={24} className="text-[#ff0050]" />
              </div>
              <div>
                <p className="font-bold text-black">Eco-Truck</p>
                <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Heavy Loads</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Fixed Bottom Navigation ─── */}
      <div className="absolute bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 px-6 pt-3 pb-8 flex justify-between items-center shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
        <button className="flex flex-col items-center gap-1 text-[#ff0050]">
          <Home size={24} />
          <span className="text-[10px] font-bold">Home</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-400">
          <History size={24} />
          <span className="text-[10px] font-bold">Trips</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-400">
          <Wallet size={24} />
          <span className="text-[10px] font-bold">Wallet</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-400">
          <User size={24} />
          <span className="text-[10px] font-bold">Account</span>
        </button>
      </div>
    </div>
  );
}
