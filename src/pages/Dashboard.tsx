import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  CheckCircle2,
  FileText,
  Plus,
  SearchX,
  UserPlus,
  Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { EmptyState, PageHeader, Skeleton, SkeletonTable, StatCard } from '../components/ui';
import ClientFilterBar, { hasActiveFilters } from '../components/ClientFilterBar';
import { DEFAULT_FILTERS, filterClients, type ClientFilters } from '../lib/clientFilters';
import { greeting } from '../lib/utils';
import ClientCard from '../components/ClientCard';
import ClientTable from '../components/ClientTable';

export default function Dashboard() {
  const { clients } = useApp();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<ClientFilters>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 450);
    return () => window.clearTimeout(t);
  }, []);

  const total = clients.length;
  const active = clients.filter(
    (c) => c.status === 'In Progress' || c.status === 'Review'
  ).length;
  const drafts = clients.filter((c) => c.status === 'Draft').length;
  const completed = clients.filter((c) => c.status === 'Completed').length;

  const filtered = filterClients(clients, filters);
  const recent = filtered.slice(0, 6);

  const noClientsAtAll = !loading && total === 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={
          <span>
            {greeting()} <span className="inline-block">👋</span>
          </span>
        }
        subtitle="Manage your clients and turn their requirements into professional project briefs."
        actions={
          <button onClick={() => navigate('/clients/new')} className="btn-primary whitespace-nowrap">
            <Plus size={17} strokeWidth={2.5} /> Add New Client
          </button>
        }
      />

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-5">
              <Skeleton className="h-11 w-11 rounded-xl" />
              <Skeleton className="mt-4 h-3.5 w-20" />
              <Skeleton className="mt-2 h-7 w-10" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={Users} label="Total Clients" value={total} iconClass="bg-gradient-to-br from-brand-500 to-indigo-600" />
          <StatCard icon={Briefcase} label="Active Projects" value={active} iconClass="bg-gradient-to-br from-blue-500 to-cyan-600" />
          <StatCard icon={FileText} label="Drafts" value={drafts} iconClass="bg-gradient-to-br from-amber-500 to-orange-600" />
          <StatCard icon={CheckCircle2} label="Completed" value={completed} iconClass="bg-gradient-to-br from-emerald-500 to-teal-600" />
        </div>
      )}

      {noClientsAtAll ? (
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
          {/* Filters */}
          <ClientFilterBar filters={filters} onChange={setFilters} />

          {/* Recent clients */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="section-title">Recent Clients</h2>
              <button
                onClick={() => navigate('/clients')}
                className="text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
              >
                View all clients →
              </button>
            </div>

            {loading ? (
              <SkeletonTable rows={5} />
            ) : recent.length === 0 ? (
              <div className="card flex flex-col items-center px-6 py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                  <SearchX size={24} />
                </div>
                <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
                  No clients match your filters
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Try adjusting the search or clearing the active filters.
                </p>
                {hasActiveFilters(filters) && (
                  <button
                    onClick={() => setFilters(DEFAULT_FILTERS)}
                    className="btn-secondary btn-sm mt-4"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Cards on small screens */}
                <div className="grid gap-4 sm:grid-cols-2 md:hidden xl:grid-cols-3">
                  {recent.map((c) => (
                    <ClientCard key={c.id} client={c} />
                  ))}
                </div>
                {/* Table from md up */}
                <div className="hidden md:block">
                  <ClientTable clients={recent} />
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}