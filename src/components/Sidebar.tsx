import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MonitorSmartphone,
  Moon,
  Palette,
  Settings,
  Sun,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { cn, initials } from '../lib/utils';
import { useApp } from '../context/AppContext';
import { Logo } from './ui';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const NAV: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/clients', label: 'Clients', icon: Users },
  { to: '/prototypes', label: 'Prototypes', icon: MonitorSmartphone },
  { to: '/themes', label: 'Website Themes', icon: Palette },
  { to: '/settings', label: 'Settings', icon: Settings },
];

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const { settings, mode, toggleMode } = useApp();
  const displayName = settings.agencyName || 'Your Agency';

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-6 pt-6">
        <Logo />
      </div>

      <nav className="flex-1 space-y-1 px-3" aria-label="Main navigation">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all',
                isActive
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/25'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-white'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  size={19}
                  className={cn(
                    'transition-colors',
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'
                  )}
                />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-3 px-3 pb-5">
        <button
          onClick={toggleMode}
          className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <span className="flex items-center gap-2.5">
            {mode === 'dark' ? <Moon size={17} /> : <Sun size={17} />}
            {mode === 'dark' ? 'Dark mode' : 'Light mode'}
          </span>
          <span
            className={cn(
              'relative h-5 w-9 rounded-full transition-colors',
              mode === 'dark' ? 'bg-brand-600' : 'bg-slate-300'
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all',
                mode === 'dark' ? 'left-[18px]' : 'left-0.5'
              )}
            />
          </span>
        </button>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-violet-600 text-xs font-bold text-white">
            {initials(displayName)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
              {displayName}
            </p>
            <p className="truncate text-xs text-slate-400 dark:text-slate-500">
              {settings.email || 'Agency profile'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ mobile, onClose }: { mobile?: boolean; onClose?: () => void }) {
  return <NavContent onNavigate={onClose} />;
}

export { NAV };