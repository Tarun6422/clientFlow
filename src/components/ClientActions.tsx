import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Eye, FileText, Pencil, Trash2 } from 'lucide-react';
import type { Client } from '../types';
import { useApp } from '../context/AppContext';
import { generateClientPdf } from '../lib/pdf';
import { ConfirmModal } from './ui';
import { cn } from '../lib/utils';

export interface ClientActionsProps {
  client: Client;
  onDeleted?: () => void;
  className?: string;
  compact?: boolean;
  hideView?: boolean;
}

export default function ClientActions({
  client,
  onDeleted,
  className,
  compact = false,
  hideView = false,
}: ClientActionsProps) {
  const { deleteClient, duplicateClient, toast, settings } = useApp();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const view = () => navigate(`/clients/${client.id}`);
  const edit = () => navigate(`/clients/${client.id}/edit`);
  const duplicate = () => {
    duplicateClient(client.id);
    toast(`“${client.name}” duplicated as draft.`, 'info');
  };
  const remove = () => {
    deleteClient(client.id);
    toast('Client deleted.');
    onDeleted?.();
  };
  const pdf = () => {
    generateClientPdf(client, settings);
    toast('PDF generated successfully.');
  };

  const btn = compact ? 'h-8 w-8' : 'h-9 w-9';

  return (
    <>
      <div className={cn('flex items-center justify-end gap-0.5', className)}>
        {!hideView && (
          <button className={cn('icon-btn', btn)} onClick={view} title="View profile" aria-label={`View ${client.name}`}>
            <Eye size={compact ? 16 : 17} />
          </button>
        )}
        <button className={cn('icon-btn', btn)} onClick={edit} title="Edit client" aria-label={`Edit ${client.name}`}>
          <Pencil size={compact ? 15 : 16} />
        </button>
        <button className={cn('icon-btn', btn)} onClick={duplicate} title="Duplicate client" aria-label={`Duplicate ${client.name}`}>
          <Copy size={compact ? 15 : 16} />
        </button>
        <button
          className={cn('icon-btn hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400', btn)}
          onClick={pdf}
          title="Generate PDF brief"
          aria-label={`Generate PDF for ${client.name}`}
        >
          <FileText size={compact ? 15 : 16} />
        </button>
        <button
          className={cn(
            'icon-btn hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400',
            btn
          )}
          onClick={() => setConfirmOpen(true)}
          title="Delete client"
          aria-label={`Delete ${client.name}`}
        >
          <Trash2 size={compact ? 15 : 16} />
        </button>
      </div>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Delete this client?"
        message={`Are you sure you want to delete “${client.name}”${client.company ? ` from ${client.company}` : ''}? This will permanently remove their brief. This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={remove}
      />
    </>
  );
}