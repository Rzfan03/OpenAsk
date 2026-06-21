import { useState, useRef, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router'
import { Sparkles, Info, Server, Brain, ArrowUpRight, GitBranch, Lightbulb, MessageSquare, LogOut, X, Menu, LayoutDashboard, Brain as BrainIcon } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useTheme } from '@/lib/theme-context'

interface Props { onLogout: () => void }

const navItems = [
  { to: '/', label: 'Overview', icon: Info },
  { to: '/chat', label: 'Chat', icon: MessageSquare },
  { to: '/providers', label: 'Providers', icon: Server },
  { to: '/personality', label: 'Personality', icon: Brain },
  { to: '/skills', label: 'Skills', icon: Lightbulb },
  { to: '/combos', label: 'Combos', icon: GitBranch },
  { to: '/tunnel', label: 'Tunnel', icon: ArrowUpRight },
]

export default function DashboardLayout({ onLogout }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dropdown, setDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { avatarUrl } = useTheme()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdown(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleLogout() {
    try { await api.logout() } catch {}
    onLogout()
  }

  const sidebar = (
    <aside className="h-full bg-card flex flex-col">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h1 className="font-bold text-lg flex items-center gap-2">
          <Sparkles size={20} className="text-primary" />
          OpenAsk
        </h1>
        <button onClick={() => setSidebarOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted md:hidden">
          <X size={16} />
        </button>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              cn('flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                isActive ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted')
            }
          >
            <item.icon size={16} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-border">
        <Button variant="ghost" size="sm" onClick={() => { setSidebarOpen(false); handleLogout() }} className="w-full justify-start gap-2.5 text-muted-foreground">
          <LogOut size={16} /> Logout
        </Button>
      </div>
    </aside>
  )

  return (
    <div className="flex min-h-screen">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      {/* Mobile drawer */}
      <div className={'fixed left-0 top-0 h-full w-72 bg-card border-r border-border z-50 transition-transform duration-200 md:hidden ' + (sidebarOpen ? 'translate-x-0' : '-translate-x-full')}>
        {sidebar}
      </div>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-56 md:border-r md:border-border md:bg-card md:z-30 md:fixed md:inset-y-0 md:left-0">
        {sidebar}
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-56">
        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-20 flex items-center justify-between px-4 h-12 border-b border-border bg-background shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted">
            <Menu size={18} />
          </button>
          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setDropdown(!dropdown)} className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden border border-border">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-semibold text-foreground bg-muted w-full h-full flex items-center justify-center">O</span>
              )}
            </button>
            {dropdown && (
              <div className="absolute right-0 top-10 w-48 bg-card border border-border rounded-xl shadow-xl py-1.5 z-50">
                <button onClick={() => { setDropdown(false); navigate('/') }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted">
                  <LayoutDashboard size={15} className="text-muted-foreground" /> Dashboard
                </button>
                <button onClick={() => { setDropdown(false); navigate('/personality') }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted">
                  <BrainIcon size={15} className="text-muted-foreground" /> Personality
                </button>
                <div className="h-px bg-border my-1.5" />
                <button onClick={() => { setDropdown(false); handleLogout() }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-destructive hover:bg-destructive/10">
                  <LogOut size={15} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
        <main className="flex-1 p-4 md:p-8 bg-background overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
