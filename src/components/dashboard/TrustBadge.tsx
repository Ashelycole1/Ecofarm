"use client";

import type { TrustTier } from '@/lib/db';

interface TrustBadgeProps {
  tier: TrustTier;
  is_certified_organic: boolean;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
}

const TIER_CONFIG = {
  high: {
    label: 'High-Trust',
    icon: '🏆',
    bg: 'rgba(245,158,11,0.15)',
    border: 'rgba(245,158,11,0.45)',
    text: '#F59E0B',
    glow: '0 0 12px rgba(245,158,11,0.25)',
  },
  verified: {
    label: 'Eco-Verified',
    icon: '✅',
    bg: 'rgba(34,197,94,0.12)',
    border: 'rgba(34,197,94,0.40)',
    text: '#22C55E',
    glow: '0 0 12px rgba(34,197,94,0.20)',
  },
  pending: {
    label: 'Pending Review',
    icon: '🕐',
    bg: 'rgba(249,115,22,0.12)',
    border: 'rgba(249,115,22,0.35)',
    text: '#F97316',
    glow: 'none',
  },
  unverified: {
    label: 'Unverified',
    icon: '⚠️',
    bg: 'rgba(107,114,128,0.12)',
    border: 'rgba(107,114,128,0.30)',
    text: '#9CA3AF',
    glow: 'none',
  },
};

const SIZE_STYLES = {
  sm: { fontSize: '9px', padding: '3px 8px', gap: '4px', iconSize: '10px' },
  md: { fontSize: '10px', padding: '4px 10px', gap: '5px', iconSize: '12px' },
  lg: { fontSize: '12px', padding: '6px 14px', gap: '6px', iconSize: '14px' },
};

export default function TrustBadge({
  tier,
  is_certified_organic,
  score,
  size = 'md',
}: TrustBadgeProps) {
  const config = TIER_CONFIG[tier];
  const sz = SIZE_STYLES[size];

  // High-Trust only when organic + high tier
  const effectiveTier: TrustTier =
    tier === 'high' && is_certified_organic ? 'high' : tier;
  const cfg = TIER_CONFIG[effectiveTier];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: sz.gap,
          padding: sz.padding,
          borderRadius: '999px',
          background: cfg.bg,
          border: `1px solid ${cfg.border}`,
          boxShadow: cfg.glow,
          backdropFilter: 'blur(8px)',
        }}
      >
        <span style={{ fontSize: sz.iconSize }}>{cfg.icon}</span>
        <span
          style={{
            fontSize: sz.fontSize,
            fontWeight: 800,
            color: cfg.text,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          {cfg.label}
        </span>
        {score !== undefined && (
          <span
            style={{
              fontSize: sz.fontSize,
              fontWeight: 700,
              color: cfg.text,
              opacity: 0.75,
            }}
          >
            {score}%
          </span>
        )}
      </div>

      {is_certified_organic && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: sz.padding,
            borderRadius: '999px',
            background: 'rgba(34,197,94,0.08)',
            border: '1px solid rgba(34,197,94,0.25)',
          }}
        >
          <span style={{ fontSize: sz.iconSize }}>🌿</span>
          <span
            style={{
              fontSize: sz.fontSize,
              fontWeight: 700,
              color: '#86EFAC',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            Organic
          </span>
        </div>
      )}
    </div>
  );
}
