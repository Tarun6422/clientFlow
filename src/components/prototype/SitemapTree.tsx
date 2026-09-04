import { useState } from 'react';
import { ArrowDown, ArrowUp, Check, FileText, Plus, Trash2, X } from 'lucide-react';
import type { SitemapPage } from '../../types';
import { uid } from '../../lib/utils';
import { cn } from '../../lib/utils';

interface SitemapTreeProps {
  pages: SitemapPage[];
  onChange: (pages: SitemapPage[]) => void;
}

export default function SitemapTree({ pages, onChange }: SitemapTreeProps) {
  const [newLabel, setNewLabel] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const add = () => {
    const label = newLabel.trim();
    if (!label) return;
    if (pages.some((p) => p.label.toLowerCase() === label.toLowerCase())) {
      setNewLabel('');
      return;
    }
    onChange([...pages, { id: uid(), label }]);
    setNewLabel('');
  };

  const rename = (id: string, label: string) => {
    const clean = label.trim();
    if (!clean) return;
    onChange(pages.map((p) => (p.id === id ? { ...p, label: clean } : p)));
  };

  const remove = (id: string) => {
    if (pages.length <= 1) return;
    onChange(pages.filter((p) => p.id !== id));
  };

  const move = (index: number, dir: -1 | 1) => {
    const next = [...pages];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {/* Tree */}
      <div className="relative pl-6">
        {/* trunk */}
        <div className="absolute bottom-0 left-[9px] top-0 w-px bg-slate-200 dark:bg-slate-700" />
        <div className="relative flex items-center gap-3">
          <span className="relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
            <FileText size={11} />
          </span>
          <span className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Website
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            {pages.length} pages
          </span>
        </div>

        <div className="relative mt-2 space-y-2 pl-6">
          {pages.map((page, index) => (
            <div key={page.id} className="group relative flex items-center gap-2 animate-fade-in">
              {/* branch line */}
              <span className="absolute -left-6 top-1/2 h-px w-5 bg-slate-200 dark:bg-slate-700" />
              <span className="relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-[9px] font-bold text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400">
                {index + 1}
              </span>

              {editingId === page.id ? (
                <div className="flex flex-1 items-center gap-1.5">
                  <input
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        rename(page.id, editValue);
                        setEditingId(null);
                      }
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    className="input max-w-[220px] py-1.5 text-sm"
                    aria-label={`Rename ${page.label}`}
                  />
                  <button
                    onClick={() => {
                      rename(page.id, editValue);
                      setEditingId(null);
                    }}
                    className="icon-btn !h-7 !w-7 text-emerald-600 dark:text-emerald-400"
                    aria-label="Save name"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="icon-btn !h-7 !w-7"
                    aria-label="Cancel rename"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex flex-1 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 transition-colors group-hover:border-brand-300 dark:border-slate-700 dark:bg-slate-900 dark:group-hover:border-brand-500/40">
                  <span className="flex-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {page.label}
                  </span>
                  <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => {
                        setEditingId(page.id);
                        setEditValue(page.label);
                      }}
                      className="icon-btn !h-7 !w-7"
                      title="Rename page"
                      aria-label={`Rename ${page.label}`}
                    >
                      <FileText size={13} />
                    </button>
                    <button
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      className="icon-btn !h-7 !w-7 disabled:opacity-30"
                      title="Move up"
                      aria-label={`Move ${page.label} up`}
                    >
                      <ArrowUp size={13} />
                    </button>
                    <button
                      onClick={() => move(index, 1)}
                      disabled={index === pages.length - 1}
                      className="icon-btn !h-7 !w-7 disabled:opacity-30"
                      title="Move down"
                      aria-label={`Move ${page.label} down`}
                    >
                      <ArrowDown size={13} />
                    </button>
                    <button
                      onClick={() => remove(page.id)}
                      disabled={pages.length <= 1}
                      className="icon-btn !h-7 !w-7 hover:!bg-red-50 hover:!text-red-600 dark:hover:!bg-red-500/10 dark:hover:!text-red-400 disabled:opacity-30"
                      title="Delete page"
                      aria-label={`Delete ${page.label}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add page */}
      <div className="flex gap-2 pl-6">
        <div className="flex flex-1 items-center gap-2">
          <span className="h-5 w-5 shrink-0 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600" />
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') add();
            }}
            placeholder="Add a page, e.g. Careers, Gallery…"
            aria-label="New page name"
            className="input max-w-xs py-1.5 text-sm"
          />
          <button onClick={add} className="btn-secondary btn-sm shrink-0">
            <Plus size={14} /> Add page
          </button>
        </div>
      </div>

      <p className={cn('pl-6 text-xs text-slate-400 dark:text-slate-500')}>
        Tip: hover a page to rename, reorder or delete it. The sitemap drives the page blueprints and the prototype.
      </p>
    </div>
  );
}