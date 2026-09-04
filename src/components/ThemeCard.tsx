import { Check, Eye } from 'lucide-react';
import type { ThemeWithPreview } from '../themes';
import { cn } from '../lib/utils';
import ScaledPreview from './ScaledPreview';

interface ThemeCardProps {
  theme: ThemeWithPreview;
  selected?: boolean;
  onPreview: () => void;
  onSelect: () => void;
  selectLabel?: string;
}

export default function ThemeCard({
  theme,
  selected = false,
  onPreview,
  onSelect,
  selectLabel = 'Select Theme',
}: ThemeCardProps) {
  const Preview = theme.preview;
  return (
    <div
      className={cn(
        'card group flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lift',
        selected &&
          'border-brand-500 ring-2 ring-brand-500/60 dark:border-brand-500'
      )}
    >
      {/* Screenshot */}
      <button
        onClick={onPreview}
        className="relative block w-full cursor-zoom-in overflow-hidden border-b border-slate-200 bg-slate-100 text-left dark:border-slate-800"
        aria-label={`Preview the ${theme.name} theme`}
      >
        <ScaledPreview clipHeight={820} className="w-full transition-transform duration-500 group-hover:scale-[1.015]">
          <Preview />
        </ScaledPreview>
        {selected && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-3 py-1 text-xs font-bold text-white shadow-lg shadow-brand-600/40">
            <Check size={13} strokeWidth={3} /> Selected
          </span>
        )}
        <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-gradient-to-t from-slate-950/70 to-transparent pb-3 pt-8 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
          <Eye size={14} /> Click to preview full site
        </span>
      </button>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">{theme.name}</h3>
          <div className="flex items-center gap-1">
            {[theme.palette.primary, theme.palette.secondary, theme.palette.accent, theme.palette.text].map(
              (color, i) => (
                <span
                  key={i}
                  className="h-3 w-3 rounded-full border border-slate-200 dark:border-slate-700"
                  style={{ backgroundColor: color }}
                />
              )
            )}
          </div>
        </div>
        <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
          {theme.description}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {theme.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          <button onClick={onPreview} className="btn-secondary btn-sm">
            <Eye size={14} /> Preview
          </button>
          <button
            onClick={onSelect}
            className={cn('btn-primary btn-sm', selected && 'bg-emerald-600 shadow-emerald-600/25 hover:bg-emerald-700')}
          >
            {selected ? (
              <>
                <Check size={14} strokeWidth={3} /> Selected
              </>
            ) : (
              selectLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}