import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Network,
  Fingerprint,
  Monitor,
  Briefcase,
  Play,
  Menu,
  X,
  Workflow,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const menuItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/profiles', label: 'Profiles', icon: Users },
  { path: '/proxies', label: 'Proxies', icon: Network },
  { path: '/fingerprints', label: 'Fingerprints', icon: Fingerprint },
  { path: '/sessions', label: 'Sessions', icon: Monitor },
  { path: '/jobs', label: 'Jobs', icon: Briefcase },
  { path: '/executions', label: 'Executions', icon: Play },
  { path: '/workflows', label: 'Workflows', icon: Workflow },
]

export function Sidebar() {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-background border"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-full w-64 border-r bg-card transition-transform lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center border-b px-6">
            <h2 className="text-xl font-bold">NTG Login Admin</h2>
          </div>
          <nav className="flex-1 space-y-1 p-4">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  )
}

