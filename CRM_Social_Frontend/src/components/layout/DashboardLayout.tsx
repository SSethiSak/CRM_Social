import { ReactNode } from 'react';
import { Zap, LayoutDashboard, Link2, PenSquare, MessageSquare, FileText, CalendarDays, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'accounts', label: 'Accounts', icon: Link2 },
  { id: 'create', label: 'Create Post', icon: PenSquare },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'comments', label: 'Comments', icon: MessageSquare },
  { id: 'posts', label: 'Recent Posts', icon: FileText },
];

export function DashboardLayout({ children, activeTab, onTabChange }: DashboardLayoutProps) {
  const { user, logout } = useApp();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Background effects */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(59,130,246,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />
      
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900/50 border-r border-slate-800/50 backdrop-blur-xl z-50">
        {/* Logo */}
        <div className="p-6 border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl blur opacity-40 -z-10" />
            </div>
            <div>
              <h1 className="font-bold text-white text-sm">Command Center</h1>
              <p className="text-xs text-slate-500">Social Hub</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive 
                    ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-white border border-blue-500/30 shadow-lg shadow-blue-500/10' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                )}
              >
                <Icon className={cn('w-5 h-5', isActive && 'text-cyan-400')} />
                {item.label}
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50" />
                )}
              </button>
            );
          })}
        </nav>

        {/* User section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800/50">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800/30">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-sm font-medium">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-white hover:bg-slate-700/50"
              onClick={logout}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  );
}
