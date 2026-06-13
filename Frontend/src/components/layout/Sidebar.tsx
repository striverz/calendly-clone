import { NavLink, useNavigate } from 'react-router-dom';
import { Calendar, Clock, Users, Menu, X, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/event-types', icon: Clock, label: 'Event Types' },
  { to: '/availability', icon: Calendar, label: 'Availability' },
  { to: '/meetings', icon: Users, label: 'Meetings' },
];

function SidebarInner({ onClose }: { onClose?: () => void }) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Logo */}
      <div className="px-5 pt-5 pb-4" style={{ borderBottom: '1px solid #F1F5F9' }}>
        <button
          onClick={() => { navigate('/'); onClose?.(); }}
          className="flex items-center gap-2.5 group"
        >
          <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center shadow-[0_2px_8px_rgba(79,70,229,0.3)] group-hover:bg-indigo-700 transition-colors shrink-0">
            <Calendar className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900 text-[15px] tracking-tight">ScheduleFlow</span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
          Menu
        </p>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150',
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 font-medium'
              )
            }
          >
            <Icon className="w-[18px] h-[18px] shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 space-y-1" style={{ borderTop: '1px solid #F1F5F9' }}>
        <a
          href="http://localhost:3000"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          View booking pages
        </a>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors cursor-default">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
            J
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-gray-900 truncate leading-tight">John Doe</p>
            <p className="text-xs text-gray-400 truncate">john@example.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-white border border-gray-200 shadow-sm text-gray-600"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'lg:hidden fixed inset-y-0 left-0 z-40 w-64 shadow-xl transform transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarInner onClose={() => setMobileOpen(false)} />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col w-64 shrink-0"
        style={{ borderRight: '1px solid #F1F5F9' }}
      >
        <SidebarInner />
      </aside>
    </>
  );
}
