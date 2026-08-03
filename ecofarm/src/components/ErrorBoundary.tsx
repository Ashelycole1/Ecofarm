'use client'

import React from 'react'
import { Leaf, RefreshCw, AlertTriangle } from 'lucide-react'

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[EcoFarm ErrorBoundary]', error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
          style={{ background: '#061412' }}
        >
          {/* Icon */}
          <div className="w-24 h-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-8">
            <AlertTriangle className="text-warn" size={40} />
          </div>

          <h1 className="text-white font-black text-3xl tracking-tight mb-3">
            Something went wrong
          </h1>
          <p className="text-white/30 text-sm max-w-xs mb-10 leading-relaxed">
            EcoFarm encountered an unexpected error. This could be a network issue or a brief glitch.
          </p>

          {/* Error detail (dev-friendly) */}
          {this.state.error?.message && (
            <div className="mb-8 max-w-sm w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-left">
              <p className="text-[9px] text-white/20 uppercase font-black tracking-widest mb-1">Error Detail</p>
              <p className="text-white/40 text-xs font-mono break-all">
                {this.state.error.message}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={this.handleReset}
              className="flex items-center justify-center gap-2 w-full py-4 bg-forest text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-forest-light transition-all active:scale-95 shadow-lg shadow-forest/20"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full py-4 bg-white/5 border border-white/10 text-white/50 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all active:scale-95"
            >
              Go to Home
            </button>
          </div>

          <div className="mt-12 flex items-center gap-2 text-white/10">
            <Leaf size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">EcoFarm</span>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
