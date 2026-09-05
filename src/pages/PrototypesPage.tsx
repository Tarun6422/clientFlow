import { Link } from 'react-router-dom';
import { Eye, LayoutTemplate, MonitorSmartphone, Plus, Sparkles, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { EmptyState, PageHeader, StatusBadge } from '../components/ui';
import ClientAvatar from '../components/ClientAvatar';
import { getTheme } from '../themes';
import { formatDate } from '../lib/utils';

export default function PrototypesPage() {
  const { clients } = useApp();
  const withPrototype = clients.filter((c) => c.prototype);
  const withoutPrototype = clients.filter((c) => !c.prototype);

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Prototypes"
        subtitle={`${withPrototype.length} generated · ${withoutPrototype.length} awaiting generation`}
        actions={
          <Link to="/clients/new" className="btn-primary whitespace-nowrap">
            <Plus size={17} strokeWidth={2.5} /> Add New Client
          </Link>
        }
      />

      {clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clients yet"
          description="Create your first client brief and turn it into a website concept."
          action={
            <Link to="/clients/new" className="btn-primary">
              <Plus size={17} strokeWidth={2.5} /> Add New Client
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[...withPrototype, ...withoutPrototype].map((c) => {
            const theme = c.theme ? getTheme(c.theme) : undefined;
            const versions = c.prototypeVersions?.length ?? 0;
            const has = !!c.prototype;
            return (
              <div key={c.id} className="card flex flex-col p-5 transition-shadow hover:shadow-lift">
                <div className="flex items-center gap-3">
                  <ClientAvatar client={c} className="h-11 w-11 text-base" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                      {c.businessName || c.company || c.name}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {c.projectType || 'Website'} · {theme?.name ?? 'No theme selected'}
                    </p>
                  </div>
                  <StatusBadge status={c.status} />
                </div>

                <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-3 text-xs text-slate-400 dark:border-slate-800">
                  <span className="flex items-center gap-1.5">
                    <MonitorSmartphone size={13} />
                    {has ? `${c.prototype?.pages.length ?? 0} pages` : 'Not started'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <LayoutTemplate size={13} />
                    {versions === 0 ? (has ? '1 version' : 'No versions') : `${versions} version${versions === 1 ? '' : 's'}`}
                  </span>
                  <span className="ml-auto">{formatDate(c.updatedAt)}</span>
                </div>

                <div className="mt-4 flex gap-2">
                  {has ? (
                    <>
                      <Link to={`/clients/${c.id}/prototype`} className="btn-primary btn-sm flex-1">
                        <LayoutTemplate size={14} /> Open workspace
                      </Link>
                      <Link
                        to={`/clients/${c.id}/preview`}
                        className="btn-secondary btn-sm"
                        title="Open client preview"
                        aria-label={`Preview ${c.businessName || c.name}'s prototype`}
                      >
                        <Eye size={14} />
                      </Link>
                    </>
                  ) : (
                    <Link to={`/clients/${c.id}/generate`} className="btn-primary btn-sm w-full">
                      <Sparkles size={14} /> Generate Website Prototype
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}