import type { Client } from '../types';
import { getTheme } from '../themes';
import { formatDate } from '../lib/utils';
import { StatusBadge } from './ui';
import ClientAvatar from './ClientAvatar';
import ClientActions from './ClientActions';

export default function ClientTable({ clients }: { clients: Client[] }) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto scrollbar-none">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-500">
              <th className="px-5 py-3.5 font-semibold">Client</th>
              <th className="px-4 py-3.5 font-semibold">Company</th>
              <th className="px-4 py-3.5 font-semibold">Project Type</th>
              <th className="px-4 py-3.5 font-semibold">Theme</th>
              <th className="px-4 py-3.5 font-semibold">Status</th>
              <th className="px-4 py-3.5 font-semibold">Last Updated</th>
              <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => {
              const theme = c.theme ? getTheme(c.theme) : undefined;
              return (
                <tr
                  key={c.id}
                  className="group border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70 dark:border-slate-800 dark:hover:bg-slate-800/40"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <ClientAvatar client={c} />
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white">{c.name}</p>
                        <p className="max-w-[220px] truncate text-xs text-slate-400 dark:text-slate-500">
                          {c.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                    {c.company || <span className="text-slate-400 dark:text-slate-600">—</span>}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {c.projectType || 'Website'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    {theme ? (
                      <span className="inline-flex items-center gap-1.5 text-[13px] text-slate-600 dark:text-slate-300">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: theme.palette.primary }}
                        />
                        <span className="truncate">{theme.name}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-slate-500 dark:text-slate-400">
                    {formatDate(c.updatedAt)}
                  </td>
                  <td className="px-5 py-3.5">
                    <ClientActions client={c} compact className="opacity-100 lg:opacity-0 lg:transition-opacity lg:group-hover:opacity-100" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}