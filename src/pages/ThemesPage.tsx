import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Palette, Plus, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { THEMES, type ThemeWithPreview } from '../themes';
import { PageHeader } from '../components/ui';
import ThemeCard from '../components/ThemeCard';
import ThemePreviewModal from '../components/ThemePreviewModal';

export default function ThemesPage() {
  const { settings, updateSettings, toast } = useApp();
  const navigate = useNavigate();
  const [preview, setPreview] = useState<ThemeWithPreview | null>(null);
  const defaultTheme = THEMES.find((t) => t.id === settings.defaultTheme) ?? THEMES[0];

  const setDefault = (id: string) => {
    updateSettings({ defaultTheme: id });
    const theme = THEMES.find((t) => t.id === id);
    toast(`“${theme?.name}” is now the default theme for new clients.`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Website Themes"
        subtitle="Six design directions with full live previews. Pick a default and select per client."
        actions={
          <button onClick={() => navigate('/clients/new')} className="btn-primary whitespace-nowrap">
            <Plus size={17} strokeWidth={2.5} /> Add New Client
          </button>
        }
      />

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-brand-200 bg-brand-50/60 px-4 py-3 dark:border-brand-500/30 dark:bg-brand-500/5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
          <Palette size={16} />
        </span>
        <p className="flex-1 text-sm text-slate-700 dark:text-slate-300">
          <span className="font-bold text-slate-900 dark:text-white">Current default:</span>{' '}
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: defaultTheme.palette.primary }}
            />
            {defaultTheme.name}
          </span>
          <span className="text-slate-500 dark:text-slate-400">
            {' '}— automatically preselected when you add a new client.
          </span>
        </p>
        <button onClick={() => setPreview(defaultTheme)} className="btn-secondary btn-sm">
          <Sparkles size={14} /> Preview default
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
        {THEMES.map((theme) => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            selected={settings.defaultTheme === theme.id}
            selectLabel="Set as default"
            onPreview={() => setPreview(theme)}
            onSelect={() => setDefault(theme.id)}
          />
        ))}
      </div>

      {preview && (
        <ThemePreviewModal
          theme={preview}
          contextNote={
            settings.defaultTheme === preview.id
              ? 'Current default theme'
              : 'New client default'
          }
          selectLabel={
            settings.defaultTheme === preview.id ? 'Default Theme ✓' : 'Set As Default Theme'
          }
          onSelect={() => {
            setDefault(preview.id);
            setPreview(null);
          }}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}