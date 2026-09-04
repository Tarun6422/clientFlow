import { useEffect } from 'react';
import { Check, X } from 'lucide-react';
import type { ThemeWithPreview } from '../themes';
import ScaledPreview from './ScaledPreview';

interface ThemePreviewModalProps {
  theme: ThemeWithPreview | null;
  contextNote?: string;
  selectLabel?: string;
  onSelect?: () => void;
  onClose: () => void;
}

export default function ThemePreviewModal({
  theme,
  contextNote,
  selectLabel = 'Select This Theme',
  onSelect,
  onClose,
}: ThemePreviewModalProps) {
  useEffect(() => {
    if (!theme) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [theme, onClose]);

  if (!theme) return null;
  const Preview = theme.preview;

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-slate-950/95 p-0 backdrop-blur animate-fade-in sm:p-4">
      <div className="flex shrink-0 flex-col gap-3 border-b border-white/10 bg-slate-900 px-4 py-3 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-bold text-white">{theme.name}</h2>
              <div className="hidden items-center gap-1.5 sm:flex">
                {[theme.palette.primary, theme.palette.secondary, theme.palette.accent, theme.palette.text].map(
                  (color, i) => (
                    <span
                      key={i}
                      className="h-4 w-4 rounded-full border border-white/20"
                      style={{ backgroundColor: color }}
                    />
                  )
                )}
              </div>
              {contextNote && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
                  For: {contextNote}
                </span>
              )}
            </div>
            <p className="mt-1 max-w-3xl text-sm text-slate-400">{theme.description}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={onSelect}
              className="btn-primary whitespace-nowrap"
            >
              <Check size={16} strokeWidth={3} /> {selectLabel}
            </button>
            <button onClick={onClose} className="icon-btn bg-white/10 text-white hover:bg-white/20 hover:text-white" aria-label="Close preview">
              <X size={19} />
            </button>
          </div>
        </div>
      </div>

      {/* Live preview — real scrolling site, scaled to fit */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto max-w-[1360px] pb-8">
          <ScaledPreview className="w-full shadow-2xl">
            <Preview />
          </ScaledPreview>
        </div>
      </div>
    </div>
  );
}