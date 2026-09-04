import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import Topbar from './Topbar';

export default function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[268px] overflow-y-auto border-r border-slate-200 bg-white lg:block dark:border-slate-800 dark:bg-slate-950">
        <Sidebar />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[90] lg:hidden">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] animate-fade-in"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-[290px] max-w-[85vw] overflow-y-auto border-r border-slate-200 bg-white shadow-2xl animate-drawer-in dark:border-slate-800 dark:bg-slate-950">
            <Sidebar mobile onClose={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}

      <Topbar onMenu={() => setDrawerOpen(true)} />

      <main className="lg:pl-[268px]">
        <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}