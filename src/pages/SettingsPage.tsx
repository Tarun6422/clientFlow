import { useRef, useState } from 'react';
import {
  Bot,
  Building2,
  FileText,
  Image as ImageIcon,
  RotateCcw,
  Save,
  SlidersHorizontal,
  Trash2,
  Upload,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/ui';
import { Input, Select } from '../components/form';
import { CURRENCIES } from '../lib/constants';
import { THEMES } from '../themes';
import { ConfirmModal } from '../components/ui';
import { STORAGE_KEYS } from '../lib/constants';
import { cn, initials } from '../lib/utils';

const MAX_LOGO_BYTES = 1024 * 1024; // 1 MB

export default function SettingsPage() {
  const { settings, updateSettings, toast } = useApp();
  const [form, setForm] = useState({ ...settings });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const dirty = JSON.stringify(form) !== JSON.stringify(settings) || logoPreview !== null;

  const save = () => {
    updateSettings({ ...form, logo: logoPreview ?? form.logo });
    setLogoPreview(null);
    toast('Changes saved successfully.');
  };

  const onPickLogo = (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_LOGO_BYTES) {
      toast('Logo too large — please use an image under 1 MB.', 'error');
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast('Please choose an image file.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setLogoPreview(String(reader.result));
    };
    reader.readAsDataURL(file);
  };

  const resetDemo = () => {
    localStorage.removeItem(STORAGE_KEYS.clients);
    localStorage.removeItem(STORAGE_KEYS.seeded);
    window.location.reload();
  };

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
      <PageHeader
        title="Settings"
        subtitle="Your agency identity, preferences and PDF defaults."
        actions={
          <button onClick={save} disabled={!dirty} className="btn-primary">
            <Save size={16} /> Save Changes
          </button>
        }
      />

      {/* Agency profile */}
      <section className="card p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-[15px] font-bold text-slate-900 dark:text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            <Building2 size={16} />
          </span>
          Agency / Business Profile
        </h2>
        <p className="mb-5 mt-1 text-sm text-slate-500 dark:text-slate-400">
          Used on the cover of generated PDF briefs and in the sidebar.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Agency / Business Name"
            value={form.agencyName}
            onChange={(e) => set('agencyName', e.target.value)}
            placeholder="e.g. Pixel & Co. Studio"
          />
          <Input
            label="Agency Email"
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="hello@studio.com"
          />
          <Input
            label="Agency Phone"
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="+91 90000 00000"
          />
        </div>
      </section>

      {/* Branding / logo */}
      <section className="card p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-[15px] font-bold text-slate-900 dark:text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
            <ImageIcon size={16} />
          </span>
          Logo &amp; PDF Branding
        </h2>
        <div className="mt-4 flex flex-wrap items-center gap-5">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
            {logoPreview || form.logo ? (
              <img
                src={logoPreview ?? form.logo}
                alt="Agency logo"
                className="h-full w-full object-contain"
              />
            ) : (
              <span className="text-xl font-bold text-slate-300 dark:text-slate-600">
                {initials(form.agencyName) || 'C'}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <button onClick={() => fileRef.current?.click()} className="btn-secondary btn-sm">
                <Upload size={14} /> {form.logo || logoPreview ? 'Replace logo' : 'Upload logo'}
              </button>
              {(form.logo || logoPreview) && (
                <button
                  onClick={() => {
                    setLogoPreview(null);
                    set('logo', '');
                  }}
                  className="btn btn-sm border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
                >
                  <Trash2 size={14} /> Remove
                </button>
              )}
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              PNG or JPG under 1 MB. Embedded into the PDF cover page.
            </p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={(e) => onPickLogo(e.target.files?.[0])}
          />
        </div>
        <div className="mt-5">
          <Input
            label="PDF Footer Text"
            hint="Shown at the bottom of the brief cover."
            value={form.pdfFooter}
            onChange={(e) => set('pdfFooter', e.target.value)}
            placeholder="Prepared with care by Your Agency"
          />
        </div>
      </section>

      {/* Preferences */}
      <section className="card p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-[15px] font-bold text-slate-900 dark:text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
            <SlidersHorizontal size={16} />
          </span>
          Preferences
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Select
            label="Default Currency"
            value={form.defaultCurrency}
            onChange={(e) => set('defaultCurrency', e.target.value)}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Select
            label="Default Theme for New Clients"
            value={form.defaultTheme}
            onChange={(e) => set('defaultTheme', e.target.value)}
          >
            {THEMES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </div>
      </section>

      {/* AI provider */}
      <section className="card p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-[15px] font-bold text-slate-900 dark:text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-500/10 dark:text-fuchsia-400">
            <Bot size={16} />
          </span>
          AI Assistance
        </h2>
        <p className="mb-5 mt-1 text-sm text-slate-500 dark:text-slate-400">
          Powers the ✨ AI buttons in the prototype workspace (improve copy, rewrite headings, generate CTAs, suggest
          sections and SEO titles) and can optionally assist the generation pipeline (extra sitemap pages and plan
          suggestions). The built-in engine works fully offline — connect your own OpenAI-compatible endpoint for
          higher quality. No keys are hardcoded; everything is stored in your own settings, and any API failure falls
          back to the built-in engine automatically.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">AI Provider</label>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => set('aiProvider', 'local')}
                className={cn(
                  'flex cursor-pointer flex-col items-start gap-1 rounded-xl border-2 px-4 py-3.5 text-left transition-all',
                  form.aiProvider === 'local'
                    ? 'border-brand-600 bg-brand-50/60 dark:bg-brand-500/10'
                    : 'border-slate-200 hover:border-brand-300 dark:border-slate-700'
                )}
              >
                <span className="text-sm font-bold text-slate-900 dark:text-white">Built-in AI (offline)</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Deterministic template engine. Always available, zero setup, no data leaves the browser.
                </span>
              </button>
              <button
                type="button"
                onClick={() => set('aiProvider', 'custom')}
                className={cn(
                  'flex cursor-pointer flex-col items-start gap-1 rounded-xl border-2 px-4 py-3.5 text-left transition-all',
                  form.aiProvider === 'custom'
                    ? 'border-brand-600 bg-brand-50/60 dark:bg-brand-500/10'
                    : 'border-slate-200 hover:border-brand-300 dark:border-slate-700'
                )}
              >
                <span className="text-sm font-bold text-slate-900 dark:text-white">Custom AI endpoint</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  OpenAI-compatible API (OpenAI, Groq, OpenRouter…). Falls back to built-in AI if unreachable.
                </span>
              </button>
            </div>
          </div>
          {form.aiProvider === 'custom' && (
            <>
              <div className="sm:col-span-2">
                <Input
                  label="API Endpoint"
                  value={form.aiEndpoint}
                  onChange={(e) => set('aiEndpoint', e.target.value)}
                  placeholder="https://api.openai.com/v1"
                />
              </div>
              <Input
                label="API Key"
                type="password"
                value={form.aiApiKey}
                onChange={(e) => set('aiApiKey', e.target.value)}
                placeholder="sk-…"
                hint="Stored only in this browser's local settings."
              />
              <Input
                label="Model"
                value={form.aiModel}
                onChange={(e) => set('aiModel', e.target.value)}
                placeholder="gpt-4o-mini"
              />
            </>
          )}
        </div>
      </section>

      {/* Data */}
      <section className="card border-red-200 p-5 sm:p-6 dark:border-red-500/30">
        <h2 className="flex items-center gap-2 text-[15px] font-bold text-slate-900 dark:text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
            <FileText size={16} />
          </span>
          Demo Data
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Restore the five realistic sample clients. This deletes all current clients and reloads
          the app.
        </p>
        <button
          onClick={() => setResetOpen(true)}
          className="btn btn-sm mt-4 border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
        >
          <RotateCcw size={14} /> Restore sample data
        </button>
      </section>

      <ConfirmModal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Restore sample data?"
        message="All current clients will be deleted and the five demo clients restored. Your settings are kept."
        confirmLabel="Restore samples"
        onConfirm={resetDemo}
      />
    </div>
  );
}