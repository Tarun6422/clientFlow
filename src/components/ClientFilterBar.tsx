import { ArrowUpDown, Search, SlidersHorizontal, X } from 'lucide-react';
import type { ClientFilters, ClientSort } from '../lib/clientFilters';
import { STATUSES } from '../lib/constants';
import { PROJECT_TYPES } from '../lib/constants';
import { THEMES } from '../themes';

interface Props {
  filters: ClientFilters;
  onChange: (next: ClientFilters) => void;
}

export function hasActiveFilters(f: ClientFilters): boolean {
  return Boolean(
    f.query.trim() || f.status !== 'All' || f.projectType !== 'All' || f.theme !== 'All'
  );
}

const SORT_OPTIONS: Array<{ value: ClientSort; label: string }> = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'name-asc', label: 'Name A–Z' },
  { value: 'name-desc', label: 'Name Z–A' },
];

export default function ClientFilterBar({ filters, onChange }: Props) {
  const set = (patch: Partial<ClientFilters>) => onChange({ ...filters, ...patch });

  return (
    <div className="card p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        {/* Search */}
        <div className="relative grow">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={filters.query}
            onChange={(e) => set({ query: e.target.value })}
            placeholder="Search by name, company or email…"
            aria-label="Search clients"
            className="input pl-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <SlidersHorizontal size={16} className="hidden text-slate-400 md:block" aria-hidden="true" />

          <select
            value={filters.status}
            onChange={(e) => set({ status: e.target.value as ClientFilters['status'] })}
            aria-label="Filter by status"
            className="input w-auto cursor-pointer py-2 pl-3 pr-8"
          >
            <option value="All">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={filters.projectType}
            onChange={(e) => set({ projectType: e.target.value })}
            aria-label="Filter by project type"
            className="input w-auto cursor-pointer py-2 pl-3 pr-8"
          >
            <option value="All">All project types</option>
            {PROJECT_TYPES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id}
              </option>
            ))}
          </select>

          <select
            value={filters.theme}
            onChange={(e) => set({ theme: e.target.value })}
            aria-label="Filter by theme"
            className="input w-auto cursor-pointer py-2 pl-3 pr-8"
          >
            <option value="All">All themes</option>
            {THEMES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <select
            value={filters.sort}
            onChange={(e) => set({ sort: e.target.value as ClientSort })}
            aria-label="Sort clients"
            className="input w-auto cursor-pointer py-2 pl-3 pr-8"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {hasActiveFilters(filters) && (
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
          <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            <ArrowUpDown size={13} />
            Filtered results
          </span>
          <button
            onClick={() =>
              onChange({
                query: '',
                status: 'All',
                projectType: 'All',
                theme: 'All',
                sort: filters.sort,
              })
            }
            className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
          >
            <X size={13} /> Clear filters
          </button>
        </div>
      )}
    </div>
  );
}