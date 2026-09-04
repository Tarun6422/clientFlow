import { useNavigate } from 'react-router-dom';
import { Calendar, Mail } from 'lucide-react';
import type { Client } from '../types';
import { getTheme } from '../themes';
import { formatDate } from '../lib/utils';
import { StatusBadge } from './ui';
import ClientAvatar from './ClientAvatar';
import ClientActions from './ClientActions';

export default function ClientCard({ client }: { client: Client }) {
  const navigate = useNavigate();
  const theme = client.theme ? getTheme(client.theme) : undefined;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/clients/${client.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') navigate(`/clients/${client.id}`);
      }}
      className="card card-hover flex cursor-pointer flex-col p-5 animate-slide-up focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <ClientAvatar client={client} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900 dark:text-white">{client.name}</p>
            <p className="truncate text-[13px] text-slate-500 dark:text-slate-400">
              {client.company || client.clientType}
            </p>
          </div>
        </div>
        <StatusBadge status={client.status} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-md bg-slate-100 px-2 py-1 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {client.projectType || 'Website'}
        </span>
        {theme && (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: theme.palette.primary }}
            />
            {theme.name}
          </span>
        )}
      </div>

      <div className="mt-4 space-y-1.5 text-[13px] text-slate-500 dark:text-slate-400">
        {client.email && (
          <p className="flex items-center gap-2 truncate">
            <Mail size={13} className="shrink-0" /> {client.email}
          </p>
        )}
        <p className="flex items-center gap-2">
          <Calendar size={13} className="shrink-0" />
          Updated {formatDate(client.updatedAt)}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {client.pages.length > 0
            ? `${client.pages.length + client.customPages.length} pages · ${client.features.length + client.customFeatures.length} features`
            : 'Requirements pending'}
        </span>
        <ClientActions client={client} compact />
      </div>
    </div>
  );
}