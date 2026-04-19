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
      <div
        className="border-t border-white/[0.08] px-2 pt-2 pb-3"
        style={{
          background: 'linear-gradient(180deg, rgba(6,20,18,0.85) 0%, rgba(6,20,18,0.97) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex items-center justify-around max-w-md mx-auto">
          {tabs.map(({ id, label, Icon }) => {
            const isActive = activeTab === id
            return (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                className={`
                  touch-target flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5
                  transition-all duration-200 relative
                  ${isActive
                    ? 'text-wheat'
                    : 'text-white/40 hover:text-white/70'
                  }
                `}
                aria-label={label}
                id={`nav-tab-${id}`}
              >
                {/* Active pill indicator */}
                {isActive && (
                  <span
                    className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-forest"
                    style={{ boxShadow: '0 0 8px rgba(45,102,95,0.8)' }}
                  />
                )}
                {/* Icon with active glow background */}
                <span className={`flex items-center justify-center rounded-xl transition-all duration-200 ${isActive ? 'bg-forest/30 w-10 h-8' : 'w-10 h-8'}`}>
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.2 : 1.7}
                    className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}
                  />
                </span>
                <span className={`text-[10px] font-semibold tracking-wide transition-all ${isActive ? 'text-wheat opacity-100' : 'opacity-50'}`}>
                  {label}
                </span>

                {/* Alert badge on Alerts tab */}
                {id === 'alerts' && (
                  <span className="absolute top-1.5 right-2 w-2 h-2 bg-alert rounded-full ring-1 ring-forest-deep" />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
