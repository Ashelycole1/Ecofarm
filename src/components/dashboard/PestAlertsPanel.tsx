'use client'

import { useApp } from '@/context/AppContext'
import { Bug, AlertTriangle, Info, AlertCircle } from 'lucide-react'
import type { PestAlert } from '@/lib/mockData'

const severityStyles = {
  low:    { border: 'border-safe/30',  bg: 'bg-safe/10',   text: 'text-safe',   label: 'LOW',    Icon: Info },
  medium: { border: 'border-warn/40',  bg: 'bg-warn/10',   text: 'text-warn',   label: 'MEDIUM', Icon: AlertTriangle },
  high:   { border: 'border-alert/40', bg: 'bg-alert/10',  text: 'text-alert',  label: 'HIGH',   Icon: AlertCircle },
}

function AlertCard({ alert }: { alert: PestAlert }) {
  const s = severityStyles[alert.severity] || severityStyles.medium
  return (
    <div className={`mh-card p-6 space-y-4 border ${s.border} bg-white shadow-card-sm hover:translate-y-[-2px] transition-all duration-300`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-bone-low border border-border-soft flex items-center justify-center shadow-inner">
             <Bug className={`${s.text}`} size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-display font-bold text-ink text-lg leading-tight tracking-tight">{alert.pestName}</p>
              {alert.reporterName && (
                <span className="px-2 py-0.5 rounded bg-forest/10 text-forest border border-forest/20 font-body text-[9px] font-bold tracking-wider">
                  {alert.reporterName}
                </span>
              )}
            </div>
            <p className="font-body text-[10px] text-ink-muted font-bold uppercase tracking-wider mt-0.5">
              {alert.lastReported} · {alert.reportCount} reports
            </p>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-full font-body text-[9px] font-bold uppercase tracking-widest ${s.bg} border ${s.border} ${s.text} shrink-0`}>
          {s.label}
        </span>
      </div>

      <p className="font-body text-xs text-ink leading-relaxed font-medium">{alert.description}</p>

      <div className="rounded-xl px-4 py-3 bg-bone-low border border-border-soft">
        <p className="font-body text-[9px] text-ink-muted font-bold uppercase tracking-wider mb-1">Recovery Action</p>
        <p className="font-body text-xs text-ink leading-relaxed font-medium italic">&quot;{alert.action}&quot;</p>
      </div>

      <div className="flex flex-wrap gap-1.5 pt-0.5">
        {alert.affectedCrops.map(crop => (
          <span key={crop} className="font-body text-[9px] font-bold uppercase tracking-wider rounded-full px-2.5 py-1 text-ink-muted bg-bone-low border border-border-soft">
            {crop}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function PestAlertsPanel() {
  const { pestAlerts, isLoading } = useApp()

  const high   = pestAlerts.filter(a => a.severity === 'high')
  const medium = pestAlerts.filter(a => a.severity === 'medium')
  const low    = pestAlerts.filter(a => a.severity === 'low')

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1,2,3].map(i => <div key={i} className="h-32 rounded-xl bg-bone-card animate-pulse" />)}
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex items-end justify-between px-1 border-b border-border-soft pb-4">
        <div className="space-y-1">
          <h2 className="font-display font-bold text-4xl text-ink tracking-tight">Active Alerts</h2>
          <p className="font-body text-xs text-ink-muted font-bold tracking-wide">Regional Intelligence · Updated hourly</p>
        </div>
        {high.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-alert-container border border-alert/20 mb-1">
            <span className="w-2 h-2 rounded-full bg-alert animate-pulse" />
            <span className="font-body text-[9px] font-bold text-alert uppercase tracking-wider">{high.length} CRITICAL</span>
          </div>
        )}
      </div>

      <div className="space-y-8">
        {high.length > 0 && (
          <Section Icon={AlertCircle} color="text-alert" title="Urgent Protocol" alerts={high} />
        )}
        {medium.length > 0 && (
          <Section Icon={AlertTriangle} color="text-warn" title="Observation" alerts={medium} />
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
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <Icon size={16} className={color} />
        <p className="font-body text-[10px] font-bold text-ink-muted uppercase tracking-wider">{title}</p>
      </div>
      <div className="space-y-4">
        {alerts.map(a => <AlertCard key={a.id} alert={a} />)}
      </div>
    </div>
  )
}
