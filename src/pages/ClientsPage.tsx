import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, List, Plus, SearchX, UserPlus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { EmptyState, PageHeader, SegmentedControl } from '../components/ui';
import ClientFilterBar, { hasActiveFilters } from '../components/ClientFilterBar';
import { DEFAULT_FILTERS, filterClients, type ClientFilters } from '../lib/clientFilters';
import type { ViewMode } from '../types';
import { cn } from '../lib/utils';
import ClientCard from '../components/ClientCard';
import ClientTable from '../components/ClientTable';

export default function ClientsPage() {
  const { clients } = useApp();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<ClientFilters>(DEFAULT_FILTERS);
  const [view, setView] = useState<ViewMode>('grid');

  const filtered = filterClients(clients, filters);
  const showGrid = view === 'grid';

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Clients"
        subtitle={`${clients.length} ${clients.length === 1 ? 'client' : 'clients'} in your workspace`}
        actions={
          <>
            <SegmentedControl<ViewMode>
              ariaLabel="View mode"
              value={view}
              onChange={setView}
              options={[
                { value: 'grid', label: 'Grid', icon: LayoutGrid },
                { value: 'table', label: 'Table', icon: List },
              ]}
            />
            <button onClick={() => navigate('/clients/new')} className="btn-primary whitespace-nowrap">
              <Plus size={17} strokeWidth={2.5} /> Add Client
            </button>
          </>
        }
      />

      {clients.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="No clients yet"
          description="Create your first client brief and turn it into a website concept."
          action={
            <button onClick={() => navigate('/clients/new')} className="btn-primary">
              <Plus size={17} strokeWidth={2.5} /> Add New Client
            </button>
          }
        />
      ) : (
        <>
          <ClientFilterBar filters={filters} onChange={setFilters} />

          {filtered.length === 0 ? (
            <div className="card flex flex-col items-center px-6 py-14 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                <SearchX size={24} />
              </div>
              <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
                No clients found
              </h3>
              <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                Nothing matches “{filters.query}” with the current filters. Try a different search
                or clear filters.
              </p>
              {hasActiveFilters(filters) && (
                <button
                  onClick={() => setFilters(DEFAULT_FILTERS)}
                  className="btn-secondary btn-sm mt-4"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Grid / card view (always on small screens) */}
              <div
                className={cn(
                  'grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4',
                  !showGrid && 'md:hidden'
                )}
              >
                {filtered.map((c) => (
                  <ClientCard key={c.id} client={c} />
                ))}
              </div>

              {/* Table view (md and up only) */}
              {!showGrid && (
                <div className="hidden md:block">
                  <ClientTable clients={filtered} />
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}