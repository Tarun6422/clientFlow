import { useEffect, useState } from 'react';
import { Check, Loader2, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

export const GENERATION_STEPS = [
  'Analyzing requirements...',
  'Creating sitemap...',
  'Planning pages...',
  'Applying design system...',
  'Generating prototype...',
  'Prototype ready ✓',
];

const STEP_MS = 620;
const FINISH_MS = 900;

export default function GenerationScreen({
  business,
  onDone,
}: {
  business: string;
  /** May be async — the parent advances phases when the promise resolves,
      so the "Prototype ready ✓" state stays visible until generation finishes. */
  onDone: () => void | Promise<void>;
}) {
  const [step, setStep] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const timers: number[] = [];
    GENERATION_STEPS.forEach((_, i) => {
      timers.push(window.setTimeout(() => setStep(i), i * STEP_MS));
    });
    timers.push(
      window.setTimeout(() => {
        setFinished(true);
      }, (GENERATION_STEPS.length - 1) * STEP_MS + FINISH_MS)
    );
    timers.push(
      window.setTimeout(() => {
        onDone();
      }, GENERATION_STEPS.length * STEP_MS + FINISH_MS + 700)
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const progress = Math.min(100, Math.round(((step + 1) / GENERATION_STEPS.length) * 100));

  return (
    <div className="relative flex min-h-[60vh] flex-col items-center justify-center overflow-hidden px-6 text-center">
      {/* ambient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute left-1/4 top-1/2 h-56 w-56 rounded-full bg-violet-500/15 blur-3xl" />
        <div className="absolute right-1/4 top-1/2 h-56 w-56 rounded-full bg-fuchsia-500/15 blur-3xl" />
      </div>

      <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-xl shadow-brand-600/30 animate-scale-in">
        {finished ? (
          <Check size={36} strokeWidth={3} className="animate-scale-in" />
        ) : (
          <Sparkles size={34} className="animate-pulse" />
        )}
      </div>

      <h2 className="mt-6 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
        {finished ? 'Prototype ready!' : `Generating website prototype for ${business || 'this client'}`}
      </h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        {finished
          ? 'Your sitemap, page blueprints and interactive prototype are ready to review and edit.'
          : 'ClientFlow is turning the collected requirements into a full website prototype.'}
      </p>

      {/* Progress bar */}
      <div className="relative mt-8 h-2 w-full max-w-md overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-violet-600 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step list */}
      <ol className="relative mt-8 w-full max-w-md space-y-3 text-left">
        {GENERATION_STEPS.map((label, i) => {
          const done = i < step;
          const current = i === step && !finished;
          return (
            <li key={label} className="flex items-center gap-3">
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold transition-all',
                  done && 'border-emerald-500 bg-emerald-500 text-white',
                  current && 'border-brand-500 bg-brand-500 text-white',
                  !done && !current && 'border-slate-300 text-slate-400 dark:border-slate-700 dark:text-slate-500'
                )}
              >
                {done ? <Check size={13} strokeWidth={3.5} /> : current ? <Loader2 size={13} className="animate-spin" /> : i + 1}
              </span>
              <span
                className={cn(
                  'text-sm font-medium transition-colors',
                  done && 'text-slate-500 line-through decoration-slate-300 dark:text-slate-400 dark:decoration-slate-700',
                  current && 'text-slate-900 dark:text-white',
                  !done && !current && 'text-slate-400 dark:text-slate-500'
                )}
              >
                {label}
              </span>
              {done && <span className="ml-auto text-[10px] font-bold uppercase tracking-wide text-emerald-500">Done</span>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}