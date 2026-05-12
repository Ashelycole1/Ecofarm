'use client'

import { useFirebase } from '@/context/FirebaseContext'
import { Bug, AlertTriangle, Info, AlertCircle, Sparkles } from 'lucide-react'
import type { PestAlert } from '@/lib/mockData'

const severityStyles = {
  low:    { border: 'border-safe/30',  bg: 'bg-safe/10',   text: 'text-safe',   label: 'LOW',    Icon: Info },
  medium: { border: 'border-wheat/40', bg: 'bg-wheat/10',  text: 'text-wheat',  label: 'MEDIUM', Icon: AlertTriangle },
  high:   { border: 'border-alert/40', bg: 'bg-alert/10',  text: 'text-alert',  label: 'HIGH',   Icon: AlertCircle },
}

function AlertCard({ alert }: { alert: PestAlert }) {
  const s = severityStyles[alert.severity]
  return (
    <div
      className={`rounded-[24px] p-6 space-y-4 border ${s.border} ${s.bg} shadow-xl hover:translate-y-[-4px] transition-all duration-300`}
      style={{ backdropFilter: 'blur(12px)' }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl">
             <Bug className={`${s.text}`} size={24} />
          </div>
          <div>
            <p className="font-black text-white text-base uppercase tracking-tight">{alert.pestName}</p>
            <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mt-1">{alert.lastReported} · {alert.reportCount} reports</p>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${s.bg} border ${s.border} ${s.text} shrink-0`}>{s.label}</span>
      </div>

      <p className="text-xs text-white/60 leading-relaxed font-medium">{alert.description}</p>

      <div className="rounded-2xl px-4 py-3 bg-black/40 border border-white/5">
        <p className="text-[9px] text-white/20 font-black uppercase tracking-widest mb-1.5">Recovery Action</p>
        <p className="text-xs text-white/80 leading-relaxed font-medium italic">"{alert.action}"</p>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        {alert.affectedCrops.map(crop => (
          <span key={crop} className="text-[9px] font-black uppercase tracking-[0.15em] rounded-full px-3 py-1 text-white/30 bg-white/5 border border-white/5">
            {crop}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function PestAlertsPanel() {
  const { pestAlerts, isLoading } = useFirebase()

  const high   = pestAlerts.filter(a => a.severity === 'high')
  const medium = pestAlerts.filter(a => a.severity === 'medium')
  const low    = pestAlerts.filter(a => a.severity === 'low')

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1,2,3].map(i => <div key={i} className="skeleton h-32 rounded-[24px]" />)}
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-end justify-between px-2">
        <div className="space-y-1">
          <h2 className="font-display font-black text-2xl text-white uppercase tracking-tight">Active Alerts</h2>
          <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">Regional Intelligence · Updated hourly</p>
        </div>
        {high.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-alert/10 border border-alert/20">
            <span className="w-1.5 h-1.5 rounded-full bg-alert animate-pulse" />
            <span className="text-[9px] font-black text-alert uppercase tracking-widest">{high.length} CRITICAL</span>
          </div>
        )}
      </div>

      <div className="space-y-10">
        {high.length > 0 && (
          <Section Icon={AlertCircle} color="text-alert" title="Urgent Protocol" alerts={high} />
        )}
        {medium.length > 0 && (
          <Section Icon={AlertTriangle} color="text-warning" title="Observation" alerts={medium} />
        )}
        {low.length > 0 && (
          <Section Icon={Info} color="text-safe" title="Monitoring" alerts={low} />
        )}
      </div>
    </div>
  )
}

function Section({ title, alerts, Icon, color }: { title: string; alerts: PestAlert[]; Icon: any; color: string }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-2">
        <Icon size={14} className={color} />
        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">{title}</p>
      </div>
      <div className="space-y-4">
        {alerts.map(a => <AlertCard key={a.id} alert={a} />)}
      </div>
    </div>
  )
}
