import type { Client } from '../types';
import { getTheme } from '../themes';
import { cn, initials } from '../lib/utils';

export default function ClientAvatar({
  client,
  className,
}: {
  client: Client;
  className?: string;
}) {
  const theme = client.theme ? getTheme(client.theme) : undefined;
  return (
    <div
      className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white',
        className
      )}
      style={
        theme
          ? { backgroundColor: theme.palette.primary }
          : { backgroundImage: 'linear-gradient(135deg, #6366F1, #7C3AED)' }
      }
      aria-hidden="true"
    >
      {initials(client.name) || 'C'}
    </div>
  );
}