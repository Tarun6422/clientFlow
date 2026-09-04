import { Menu, Moon, Sun } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Logo } from './ui';

export default function Topbar({ onMenu }: { onMenu: () => void }) {
  const { mode, toggleMode } = useApp();
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white/85 px-4 py-3 backdrop-blur lg:hidden dark:border-slate-800 dark:bg-slate-950/85">
      <div className="flex items-center gap-3">
        <button onClick={onMenu} className="icon-btn" aria-label="Open menu">
          <Menu size={20} />
        </button>
        <Logo compact />
      </div>
      <button
        onClick={toggleMode}
        className="icon-btn"
        aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {mode === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
      </button>
    </header>
  );
}