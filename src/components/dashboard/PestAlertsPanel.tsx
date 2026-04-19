'use client'

import { useFirebase } from '@/context/FirebaseContext'
import type { PestAlert } from '@/lib/mockData'

const severityStyles = {
  low:    { border: 'border-safe/30',  bg: 'bg-safe/10',   text: 'text-safe',   label: 'LOW'    },
  medium: { border: 'border-wheat/40', bg: 'bg-wheat/10',  text: 'text-wheat',  label: 'MEDIUM' },
  high:   { border: 'border-alert/40', bg: 'bg-alert/10',  text: 'text-alert',  label: 'HIGH'   },
}

function AlertCard({ alert }: { alert: PestAlert }) {
  const s = severityStyles[alert.severity]
  return (
    <div
      className={`rounded-2xl p-4 space-y-2.5 border ${s.border} ${s.bg}`}
      style={{ backdropFilter: 'blur(12px)', background: undefined }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{alert.emoji}</span>
          <div>
            <p className="font-bold text-white text-sm leading-tight">{alert.pestName}</p>
            <p className="text-[10px] text-white/35 mt-0.5">{alert.lastReported} · {alert.reportCount} reports</p>
          </div>
        </div>
        <span className={`badge ${s.bg} border ${s.border} ${s.text} shrink-0`}>{s.label}</span>
      </div>

      <p className="text-xs text-white/65 leading-relaxed">{alert.description}</p>

      <div className="rounded-xl px-3 py-2" style={{ background: 'rgba(0,0,0,0.25)' }}>
        <p className="text-[10px] text-white/35 uppercase tracking-wider mb-1">Recommended Action</p>
        <p className="text-xs text-white/80 leading-relaxed">{alert.action}</p>
      </div>

      <div className="flex flex-wrap gap-1 pt-0.5">
        {alert.affectedCrops.map(crop => (
          <span key={crop} className="text-[10px] rounded-full px-2 py-0.5 text-white/45"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>
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
      <div className="space-y-3">
        {[1,2,3].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display font-bold text-white text-lg high-contrast-text">Pest Alerts</h2>
          <p className="text-xs text-white/40">Active in Uganda · Updated hourly</p>
        </div>
        <div className="flex items-center gap-1.5">
          {high.length > 0 && (
            <span className="badge bg-alert/15 border border-alert/40 text-alert">🔴 {high.length} high</span>
          )}
        </div>
      </div>

      {high.length > 0 && (
        <Section title="⚡ Urgent" alerts={high} />
      )}
      {medium.length > 0 && (
        <Section title="⚠️ Watch" alerts={medium} />
      )}
      {low.length > 0 && (
        <Section title="ℹ️ Monitor" alerts={low} />
      )}
    </div>
  )
}

function Section({ title, alerts }: { title: string; alerts: PestAlert[] }) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-bold text-white/35 uppercase tracking-widest pl-1">{title}</p>
      {alerts.map(a => <AlertCard key={a.id} alert={a} />)}
    </div>
  )
}
