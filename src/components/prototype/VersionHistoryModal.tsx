import { History, RotateCcw } from 'lucide-react';
import type { PrototypeVersion } from '../../types';
import { Modal, ModalHeader } from '../ui';
import { cn, formatDate, relativeTime } from '../../lib/utils';

const VERSION_STATUS_CLASSES: Record<PrototypeVersion['status'], string> = {
  Draft: 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
  Preview: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/30',
  'Prototype Approved': 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30',
  'Changes Requested': 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30',
};

interface VersionHistoryModalProps {
  versions: PrototypeVersion[];
  onRestore: (version: PrototypeVersion) => void;
  onClose: () => void;
}

export default function VersionHistoryModal({ versions, onRestore, onClose }: VersionHistoryModalProps) {
  const sorted = [...versions].sort((a, b) => b.number - a.number);
  return (
    <Modal open onClose={onClose} size="lg">
      <ModalHeader
        title="Version History"
        subtitle="Every saved change creates a new version. Previous versions are never deleted."
        onClose={onClose}
      />
      <div className="flex-1 space-y-3 overflow-y-auto px-6 py-5">
        {sorted.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
            No versions yet — save the prototype to create Version 1.
          </p>
        )}
        {sorted.map((v, i) => (
          <div
            key={v.number}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 p-4 transition-colors hover:border-brand-300 dark:border-slate-700 dark:hover:border-brand-500/40"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              <History size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 dark:text-white">Version {v.number}</span>
                <span className={cn('badge', VERSION_STATUS_CLASSES[v.status])}>{v.status}</span>
              </div>
              <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                {formatDate(v.date)} · {relativeTime(v.date)}
                {v.note ? ` · ${v.note}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">{v.data.pages.length} pages</span>
              {i > 0 && (
                <button
                  onClick={() => onRestore(v)}
                  className="btn-secondary btn-sm"
                  title="Restore this version"
                >
                  <RotateCcw size={13} /> Restore
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}