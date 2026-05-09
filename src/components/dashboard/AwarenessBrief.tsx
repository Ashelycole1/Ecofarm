'use client';

import { useState } from 'react';
import { 
  FileText, 
  Info, 
  Database, 
  AlertTriangle, 
  Users, 
  HeartPulse, 
  TrendingDown, 
  ShieldCheck, 
  Compass, 
  ExternalLink,
  ChevronRight,
  Globe
} from 'lucide-react';

interface BriefSection {
  title: string;
  icon: any;
  content: string[];
  source?: string;
  sourceUrl?: string;
}

export default function AwarenessBrief() {
  const [selectedCountry, setSelectedCountry] = useState('Lebanon');

  const countries = ['Lebanon', 'Sudan', 'Ukraine', 'Syria', 'Yemen'];

  const briefData = {
    header: {
      country: selectedCountry,
      disclaimer: "Neutral Awareness Brief: This report is drawn from public sources for situational orientation only. It does not constitute operational guidance or represent political positions."
    },
    sources: [
      { name: "UN OCHA", url: "https://www.unocha.org" },
      { name: "World Bank", url: "https://www.worldbank.org" },
      { name: "WHO", url: "https://www.who.int" },
      { name: "UNHCR", url: "https://www.unhcr.org" }
    ],
    keyConcerns: [
      "Severe strain on public service infrastructure including water and electricity networks.",
      "Rapid decline in household purchasing power due to currency volatility.",
      "High concentrations of displaced populations in areas with limited service capacity."
    ],
    sections: [
      {
        title: "Displacement",
        icon: Users,
        content: [
          "Documented patterns show continued internal movement towards urban centers (UNHCR).",
          "Cross-border movement remains fluid with reported challenges at key transit points.",
          "Host communities report increasing pressure on shared resources."
        ],
        source: "UNHCR",
        sourceUrl: "#"
      },
      {
        title: "Health",
        icon: HeartPulse,
        content: [
          "Status of primary healthcare facilities indicates 30% are operating at reduced capacity (WHO).",
          "Essential medicine supply chains face documented logistics challenges.",
          "Disease surveillance systems are active but require strengthened reporting in remote areas."
        ],
        source: "WHO",
        sourceUrl: "#"
      },
      {
        title: "Economic Indicators",
        icon: TrendingDown,
        content: [
          "Macroeconomic shifts have resulted in a 40% increase in the cost of the Minimum Expenditure Basket (World Bank).",
          "Household income remains stagnant while prices of essential goods continue to evolve.",
          "Informal labor markets are expanding in response to formal sector contraction."
        ],
        source: "World Bank",
        sourceUrl: "#"
      },
      {
        title: "Protection Notes",
        icon: ShieldCheck,
        content: [
          "Access to legal documentation remains a primary hurdle for displaced vulnerable groups.",
          "Risks to vulnerable populations are heightened in informal settlements.",
          "Legal aid services are currently prioritizing documentation and housing rights."
        ],
        source: "UN OCHA",
        sourceUrl: "#"
      }
    ],
    orientation: [
      { label: "Coordinate", text: "Do not duplicate existing efforts; align with cluster leads." },
      { label: "Dignity", text: "Protect individual dignity and ensure data privacy at all times." },
      { label: "Neutrality", text: "Focus strictly on humanitarian needs and coordination protocols." }
    ]
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Country Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {countries.map(c => (
          <button
            key={c}
            onClick={() => setSelectedCountry(c)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCountry === c 
              ? 'bg-forest text-white shadow-lg shadow-forest/20' 
              : 'bg-white/5 text-white/40 hover:bg-white/10'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Header & Disclaimer */}
      <div className="p-6 rounded-3xl bg-forest-deep/40 border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Globe size={80} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-wheat mb-2">
            <FileText size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">Humanitarian Brief</span>
          </div>
          <h1 className="text-3xl font-display font-black text-white mb-4">
            {briefData.header.country} Situation
          </h1>
          <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
            <Info className="text-amber-500 shrink-0" size={18} />
            <p className="text-[11px] text-amber-200/70 leading-relaxed italic">
              {briefData.header.disclaimer}
            </p>
          </div>
        </div>
      </div>

      {/* Primary Sources */}
      <div className="flex flex-wrap gap-2">
        <div className="w-full flex items-center gap-2 px-1 mb-1">
          <Database size={14} className="text-white/30" />
          <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Verified Data Sources</span>
        </div>
        {briefData.sources.map(s => (
          <a 
            key={s.name}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-white/60 flex items-center gap-2 hover:bg-white/10 transition-colors"
          >
            {s.name}
            <ExternalLink size={10} />
          </a>
        ))}
      </div>

      {/* Key Concerns */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <AlertTriangle size={16} className="text-alert" />
          <h2 className="text-sm font-bold text-white uppercase tracking-tight">Key Concerns</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {briefData.keyConcerns.map((concern, i) => (
            <div 
              key={i}
              className="p-4 rounded-2xl bg-alert/5 border border-alert/20 flex flex-col gap-2"
            >
              <div className="w-6 h-6 rounded-lg bg-alert/20 flex items-center justify-center text-alert text-[10px] font-black">
                {i + 1}
              </div>
              <p className="text-[11px] text-white/70 leading-relaxed">
                {concern}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Thematic Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {briefData.sections.map((section, i) => (
          <div 
            key={i}
            className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col hover:border-white/20 transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-forest/20 flex items-center justify-center text-forest-light group-hover:bg-forest/30 transition-colors">
                  <section.icon size={20} />
                </div>
                <h3 className="font-display font-bold text-white text-lg">{section.title}</h3>
              </div>
            </div>
            <ul className="space-y-3 mb-6 flex-1">
              {section.content.map((item, j) => (
                <li key={j} className="flex gap-2 text-[11px] text-white/50 leading-relaxed">
                  <ChevronRight size={12} className="shrink-0 mt-0.5 text-forest-light/40" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
              <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Source: {section.source}</span>
              <a 
                href={section.sourceUrl}
                className="text-[10px] font-bold text-forest-light flex items-center gap-1 hover:underline"
              >
                View Report
                <ExternalLink size={10} />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Helper Orientation */}
      <div 
        className="p-6 rounded-3xl border border-forest-light/20 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(45,102,95,0.1) 0%, rgba(13,36,34,0.3) 100%)' }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-forest/40 flex items-center justify-center text-wheat shadow-lg">
            <Compass size={20} />
          </div>
          <div>
            <h3 className="font-display font-bold text-white text-lg">Helper Orientation</h3>
            <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">What Helpers Should Know</p>
          </div>
        </div>

        <div className="space-y-4">
          {briefData.orientation.map((item, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="text-xs font-black text-forest-light uppercase tracking-tighter w-20 pt-1 shrink-0">
                {item.label}
              </div>
              <p className="text-[12px] text-white/60 leading-relaxed italic">
                "{item.text}"
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Neutrality Note */}
      <div className="text-center pt-6 opacity-30">
        <p className="text-[9px] font-bold text-white uppercase tracking-[0.2em]">
          Humanitarian Data · Non-Political Position · Verifiable Reporting
        </p>
      </div>
    </div>
  );
}
