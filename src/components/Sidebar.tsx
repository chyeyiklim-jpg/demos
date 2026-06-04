'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { label: 'Dashboard', href: '/', icon: DashboardIcon },
  { label: 'Positions', href: '/positions', icon: TrendingUpIcon },
  { label: 'Trades', href: '/trades', icon: SwapIcon },
]

const toolItems = [
  { label: 'Alerts', href: '/alerts', icon: BellIcon },
  { label: 'Reports', href: '/reports', icon: ChartIcon },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex flex-col w-[260px] min-h-screen bg-sidebar shrink-0 border-r border-sidebar-active">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-sidebar-active">
        <div className="w-7 h-7 rounded-md bg-primary shrink-0" />
        <span className="text-sidebar-foreground font-bold text-base tracking-tight">FinanceTrack</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col px-3 pt-4 gap-0.5">
        <p className="px-3 py-1 text-[10px] font-semibold text-sidebar-muted tracking-widest uppercase">Portfolio</p>
        {navItems.map(item => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-sidebar-active text-sidebar-foreground'
                  : 'text-sidebar-muted hover:bg-sidebar-active hover:text-sidebar-foreground'
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}

        <p className="mt-4 px-3 py-1 text-[10px] font-semibold text-sidebar-muted tracking-widest uppercase">Tools</p>
        {toolItems.map(item => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-sidebar-active text-sidebar-foreground'
                  : 'text-sidebar-muted hover:bg-sidebar-active hover:text-sidebar-foreground'
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="flex-1" />

      {/* User */}
      <div className="flex items-center gap-3 px-5 py-4 border-t border-sidebar-active">
        <div className="w-8 h-8 rounded-full bg-primary shrink-0 flex items-center justify-center text-white text-xs font-bold">
          JD
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sidebar-foreground text-sm font-medium truncate">John Doe</span>
          <span className="text-sidebar-muted text-xs truncate">john@example.com</span>
        </div>
      </div>
    </aside>
  )
}

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  )
}
function TrendingUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
    </svg>
  )
}
function SwapIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  )
}
function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}
function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}
