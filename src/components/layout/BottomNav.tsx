'use client'

import { Droplets, Sun, Leaf, Bell, Home, MessageCircle, TrendingUp } from 'lucide-react'

interface BottomNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const tabs = [
  { id: 'home',     label: 'Home',     Icon: Home },
  { id: 'market',   label: 'Market',   Icon: TrendingUp },
  { id: 'calendar', label: 'Planting', Icon: Leaf },
  { id: 'chat',     label: 'Chat',     Icon: MessageCircle },
  { id: 'alerts',   label: 'Alerts',   Icon: Bell },
]

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bottom-nav-safe">
      {/* Frosted glass backdrop */}
      <div className="glass-card border-t border-white/10 border-x-0 border-b-0 px-2 pt-2 pb-3">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {tabs.map(({ id, label, Icon }) => {
            const isActive = activeTab === id
            return (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                className={`
                  touch-target flex flex-col items-center gap-0.5 rounded-leaf-sm px-3 py-1.5
                  transition-all duration-200 relative
                  ${isActive
                    ? 'text-wheat bg-forest/60 shadow-glow-green'
                    : 'text-white/50 hover:text-white/80'
                  }
                `}
                aria-label={label}
                id={`nav-tab-${id}`}
              >
                {isActive && (
                  <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-wheat shadow-glow-wheat" />
                )}
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.2 : 1.7}
                  className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}
                />
                <span className={`text-[10px] font-medium tracking-wide transition-all ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                  {label}
                </span>

                {/* Alert badge on Alerts tab */}
                {id === 'alerts' && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-alert rounded-full ring-1 ring-forest-dark" />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
