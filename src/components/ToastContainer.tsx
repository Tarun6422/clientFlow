import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { ToastType } from '../types';
import { cn } from '../lib/utils';

const META: Record<
  ToastType,
  { icon: typeof CheckCircle2; ring: string; iconColor: string }
> = {
  success: {
    icon: CheckCircle2,
    ring: 'border-emerald-200 dark:border-emerald-500/30',
    iconColor: 'text-emerald-500',
  },
  error: { icon: XCircle, ring: 'border-red-200 dark:border-red-500/30', iconColor: 'text-red-500' },
  info: { icon: Info, ring: 'border-blue-200 dark:border-blue-500/30', iconColor: 'text-blue-500' },
  warning: {
    icon: AlertTriangle,
    ring: 'border-amber-200 dark:border-amber-500/30',
    iconColor: 'text-amber-500',
  },
};

export default function ToastContainer() {
  const { toasts, dismissToast } = useApp();

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6">
      {toasts.map((t) => {
        const meta = META[t.type];
        const Icon = meta.icon;
        return (
          <div
            key={t.id}
            role="status"
            className={cn(
              'pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border bg-white py-3 pl-4 pr-3 shadow-lift animate-toast-in dark:bg-slate-900',
              meta.ring
            )}
          >
            <Icon size={19} className={cn('shrink-0', meta.iconColor)} />
            <p className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-100">
              {t.message}
            </p>
            <button
              onClick={() => dismissToast(t.id)}
              className="icon-btn h-7 w-7 shrink-0"
              aria-label="Dismiss notification"
            >
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}