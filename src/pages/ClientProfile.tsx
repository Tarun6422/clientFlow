import { useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  Building2,
  Copy,
  Eye,
  FileText,
  History,
  Info,
  Layers,
  LayoutTemplate,
  Mail,
  MessageCircle,
  Pencil,
  Phone,
  Save,
  Share2,
  Sparkles,
  Trash2,
  User,
  type LucideIcon,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getTheme, THEMES } from '../themes';
import { STATUSES, STATUS_META } from '../lib/constants';
import { formatDate, formatLongDate, initials, relativeTime } from '../lib/utils';
import { generateClientPdf } from '../lib/pdf';
import { generateProjectSummary } from '../lib/summary';
import { isPrototypeStale } from '../lib/staleness';
import { dynamicAnswerRows } from '../lib/typeQuestions';
import { cn } from '../lib/utils';
import ClientAvatar from '../components/ClientAvatar';
import ThemePreviewModal from '../components/ThemePreviewModal';
import FlowLauncher from '../components/flow/FlowLauncher';
import { ConfirmModal, Modal, ModalHeader, StatusBadge } from '../components/ui';
import ScaledPreview from '../components/ScaledPreview';
import type { ClientStatus } from '../types';
import type { ThemeWithPreview } from '../themes';

/* ---------------- small section card ---------------- */

function InfoCard({
  icon: Icon,
  title,
  step,
  clientId,
  children,
  className,
}: {
  icon: LucideIcon;
  title: string;
  step?: number;
  clientId: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('card flex flex-col p-5', className)}>
      <header className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2.5 text-[15px] font-bold text-slate-900 dark:text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            <Icon size={16} />
          </span>
          {title}
        </h2>
        {step && (
          <Link
            to={`/clients/${clientId}/edit?step=${step}`}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-brand-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-brand-400"
          >
            <Pencil size={12} /> Edit
          </Link>
        )}
      </header>
      {children}
    </section>
  );
}

function Row({ label, value, mono = false }: { label: string; value: ReactNode; mono?: boolean }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <span className="shrink-0 text-[12px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {label}
      </span>
      <span
        className={cn(
          'min-w-0 text-right text-sm font-medium text-slate-700 dark:text-slate-200',
          mono && 'font-mono text-[13px]'
        )}
      >
        {value}
      </span>
    </div>
  );
}

/* ---------------- page ---------------- */

export default function ClientProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { clients, settings, updateClient, deleteClient, duplicateClient, toast } = useApp();

  const client = useMemo(() => clients.find((c) => c.id === id), [clients, id]);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [themeModal, setThemeModal] = useState<{ open: boolean; themeId: string } | null>(null);
  const [themePickerOpen, setThemePickerOpen] = useState(false);

  if (!client) {
    return (
      <div className="card mx-auto max-w-lg px-6 py-16 text-center animate-fade-in">
        <Info size={40} className="mx-auto text-slate-300 dark:text-slate-600" />
        <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">Client not found</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          This client may have been deleted. Head back to your client list.
        </p>
        <Link to="/clients" className="btn-primary mt-6">
          <ArrowLeft size={16} /> Back to clients
        </Link>
      </div>
    );
  }

  const theme = client.theme ? getTheme(client.theme) : undefined;
  const location = [client.city, client.country].filter(Boolean).join(', ');
  const allPages = [...client.pages, ...client.customPages];
  const allFeatures = [...client.features, ...client.customFeatures];
  const hasSocials = Boolean(client.instagram || client.facebook || client.linkedin || client.otherSocial);

  const duplicate = () => {
    const copy = duplicateClient(client.id);
    if (copy) toast(`“${copy.name}” created as a draft.`, 'info');
  };

  const remove = () => {
    deleteClient(client.id);
    toast('Client deleted.');
    navigate('/clients');
  };

  const pdf = () => {
    generateClientPdf(client, settings);
    toast('PDF generated successfully.');
  };

  const sharePrototype = async () => {
    const url = `${window.location.href.split('#')[0]}#/preview/${client.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast('Client preview link copied to clipboard.');
    } catch {
      toast('Could not copy the link automatically.', 'error');
    }
  };

  const changeStatus = (status: ClientStatus) => {
    updateClient(client.id, { status });
    toast('Changes saved successfully.');
  };

  const previewTheme = theme ? THEMES.find((t) => t.id === theme.id) ?? null : null;

  const socials = [
    client.instagram && { label: 'Instagram', href: client.instagram },
    client.facebook && { label: 'Facebook', href: client.facebook },
    client.linkedin && { label: 'LinkedIn', href: client.linkedin },
    client.otherSocial && { label: 'Other', href: client.otherSocial },
  ].filter(Boolean) as Array<{ label: string; href: string }>;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back */}
      <Link
        to="/clients"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400"
      >
        <ArrowLeft size={16} /> All clients
      </Link>

      {/* Header card */}
      <div className="card overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-brand-600 via-indigo-600 to-violet-600" />
        <div className="px-5 pb-5 sm:px-7">
          <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="rounded-2xl ring-4 ring-white dark:ring-slate-900">
                <ClientAvatar client={client} className="h-20 w-20 text-xl" />
              </div>
              <div className="pb-1">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                  {client.name}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {client.company || client.businessName || 'Independent client'} ·{' '}
                  {client.clientType || 'Individual'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:pb-1">
              <StatusBadge status={client.status} />
              <span className="ml-1 hidden text-xs text-slate-400 sm:inline">
                updated {relativeTime(client.updatedAt)}
              </span>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {client.email && (
              <a href={`mailto:${client.email}`} className="btn-secondary btn-sm">
                <Mail size={14} /> {client.email}
              </a>
            )}
            {client.phone && (
              <a href={`tel:${client.phone.replace(/\s/g, '')}`} className="btn-secondary btn-sm">
                <Phone size={14} /> {client.phone}
              </a>
            )}
            <button onClick={pdf} className="btn-primary btn-sm">
              <FileText size={14} /> Generate PDF
            </button>
          </div>

          {/* Quick actions */}
          <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4 dark:border-slate-800">
            <Link
              to={`/clients/${client.id}/generate`}
              className="btn-primary btn-sm !px-4 !py-2 text-[13px] shadow-md shadow-brand-600/30"
            >
              <Sparkles size={15} /> Generate Website Prototype
            </Link>
            {client.prototype && (
              <Link to={`/clients/${client.id}/prototype`} className="btn-secondary btn-sm">
                <LayoutTemplate size={14} /> Open Workspace
              </Link>
            )}
            <Link to={`/clients/${client.id}/edit`} className="btn-secondary btn-sm">
              <Pencil size={14} /> Edit
            </Link>
            <button onClick={duplicate} className="btn-secondary btn-sm">
              <Copy size={14} /> Duplicate
            </button>
            <button
              onClick={() => setDeleteOpen(true)}
              className="btn btn-sm border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
            >
              <Trash2 size={14} /> Delete
            </button>

            {/* Status changer */}
            <div className="ml-auto flex items-center gap-2">
              <label htmlFor="status" className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Status
              </label>
              <select
                id="status"
                value={client.status}
                onChange={(e) => changeStatus(e.target.value as ClientStatus)}
                className="input w-auto cursor-pointer py-1.5 pl-3 pr-8 text-sm font-semibold"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="card border-l-4 border-l-brand-500 p-5">
        <h2 className="flex items-center gap-2 text-[15px] font-bold text-slate-900 dark:text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
            <Sparkles size={16} />
          </span>
          Project Summary
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {generateProjectSummary(client)}
        </p>
      </div>

      {/* Website Prototype (ClientFlow 2.0) */}
      <PrototypeCard client={client} onShare={sharePrototype} />

      {/* Info grid */}
      <div className="grid gap-5 lg:grid-cols-2">
        <InfoCard icon={User} title="Client Information" step={1} clientId={client.id}>
          <Row label="Full name" value={client.name} />
          <Row label="Company" value={client.company} />
          <Row label="Email" value={client.email} />
          <Row label="Phone" value={client.phone} />
          <Row label="WhatsApp" value={client.whatsapp} />
          <Row label="Client type" value={client.clientType} />
          <Row label="Preferred contact" value={client.preferredContact} />
          <Row label="Location" value={location || client.address} />
        </InfoCard>

        <InfoCard icon={Building2} title="Business Information" step={2} clientId={client.id}>
          <Row label="Business" value={client.businessName} />
          <Row label="Industry" value={client.industry} />
          <Row label="Years in business" value={client.yearsInBusiness && `${client.yearsInBusiness} years`} />
          <Row label="Existing website" value={client.existingWebsite ? <WebLink href={client.existingWebsite} /> : null} />
          <div className="pt-1">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">What does the business do?</p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {client.description || '—'}
            </p>
          </div>
          {hasSocials && (
            <div className="pt-2">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">Social links</p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    className="chip cursor-pointer !py-1 text-xs"
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            </div>
          )}
        </InfoCard>

        <InfoCard icon={Briefcase} title="Project Information" step={3} clientId={client.id}>
          <Row label="Website type" value={client.projectType} />
          <Row label="Goal" value={client.projectGoal} />
          <Row label="Audience" value={client.targetAudience} />
          <Row label="Budget" value={client.budget} />
          <Row label="Deadline" value={client.deadline ? formatLongDate(new Date(client.deadline).getTime()) : null} />
          <Row label="Content source" value={client.contentProvider} />
        </InfoCard>

        <InfoCard icon={Layers} title="Website Requirements" step={4} clientId={client.id}>
          <ChipList label="Required pages" items={allPages} />
          <div className="mt-3">
            <ChipList label="Required features" items={allFeatures} />
          </div>
          {client.projectType && dynamicAnswerRows(client.dynamicAnswers, client.projectType).length > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">
                {client.projectType} requirements
              </p>
              <div className="mt-1.5 space-y-1.5">
                {dynamicAnswerRows(client.dynamicAnswers, client.projectType).map((row) => (
                  <div key={row.label} className="flex items-start justify-between gap-4">
                    <span className="min-w-0 text-[13px] font-medium text-slate-500 dark:text-slate-400">
                      {row.label}
                    </span>
                    <span className="shrink-0 text-right text-[13px] font-semibold text-slate-700 dark:text-slate-200">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </InfoCard>

        <InfoCard icon={MessageCircle} title="Additional Notes" step={4} clientId={client.id}>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {client.notes || 'No additional notes were provided.'}
          </p>
        </InfoCard>

        {/* Theme */}
        <InfoCard icon={Eye} title="Selected Theme" clientId={client.id} className="lg:col-span-2">
          {theme ? (
            <div className="grid gap-5 md:grid-cols-[260px_1fr]">
              <button
                onClick={() => setThemeModal({ open: true, themeId: theme.id })}
                className="group relative block w-full cursor-zoom-in overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800"
                aria-label={`Preview ${theme.name} theme`}
              >
                <ScaledPreview clipHeight={560} className="w-full">
                  <theme.preview />
                </ScaledPreview>
                <span className="absolute inset-0 flex items-center justify-center gap-2 bg-slate-950/0 text-sm font-semibold text-white opacity-0 transition-all group-hover:bg-slate-950/40 group-hover:opacity-100">
                  <Eye size={16} /> Full preview
                </span>
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{theme.name}</h3>
                  {[theme.palette.primary, theme.palette.secondary, theme.palette.accent].map((c, i) => (
                    <span key={i} className="h-3.5 w-3.5 rounded-full border border-slate-200 dark:border-slate-700" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  {theme.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {theme.tags.map((t) => (
                    <span key={t} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    onClick={() => setThemeModal({ open: true, themeId: theme.id })}
                    className="btn-secondary btn-sm"
                  >
                    <Eye size={14} /> Preview theme
                  </button>
                  <button onClick={() => setThemePickerOpen(true)} className="btn-secondary btn-sm">
                    <Pencil size={14} /> Change theme
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-start gap-3">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No theme selected yet. Pick one of the six design directions to include in the brief.
              </p>
              <button onClick={() => setThemePickerOpen(true)} className="btn-primary btn-sm">
                Choose a theme
              </button>
            </div>
          )}
        </InfoCard>
      </div>

      {/* Theme live preview modal */}
      {previewTheme && themeModal?.open && (
        <ThemePreviewModal
          theme={previewTheme}
          contextNote={client.name}
          selectLabel="Keep This Theme"
          onSelect={() => {
            updateClient(client.id, { theme: themeModal.themeId });
            toast('Changes saved successfully.');
            setThemeModal(null);
          }}
          onClose={() => setThemeModal(null)}
        />
      )}

      {/* Theme picker modal */}
      <ThemePickerModal
        open={themePickerOpen}
        currentThemeId={client.theme}
        onClose={() => setThemePickerOpen(false)}
        onPick={(themeId) => {
          updateClient(client.id, { theme: themeId });
          setThemePickerOpen(false);
          toast('Theme updated.');
        }}
      />

      {/* Delete confirm */}
      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete this client?"
        message={`Are you sure you want to delete “${client.name}”${client.company ? ` from ${client.company}` : ''}? Their brief, requirements and theme will be permanently removed.`}
        onConfirm={remove}
      />

      {/* Flow — conversational robot interviewer */}
      <FlowLauncher clientId={client.id} />
    </div>
  );
}

/* ---------------- helpers ---------------- */

function ChipList({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      {items.length === 0 ? (
        <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">—</p>
      ) : (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {items.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            >
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function WebLink({ href }: { href: string }) {
  const display = href.replace(/^https?:\/\//, '').replace(/\/$/, '');
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="font-medium text-brand-600 underline-offset-2 hover:underline dark:text-brand-400"
    >
      {display}
    </a>
  );
}

/* ---------------- website prototype card ---------------- */

function PrototypeCard({ client, onShare }: { client: ReturnType<typeof useApp>['clients'][number]; onShare: () => void }) {
  const prototype = client.prototype;
  const versions = client.prototypeVersions ?? [];
  const feedback = client.feedback ?? [];
  const approved = client.approval?.approved;
  const sitemap = client.sitemap ?? [];
  const stale = isPrototypeStale(client);

  const status: ClientStatus = approved
    ? 'Prototype Approved'
    : feedback.length > 0
      ? 'Changes Requested'
      : prototype
        ? 'In Progress'
        : 'Draft';

  return (
    <section className="card overflow-hidden">
      <div className="border-b border-slate-100 bg-gradient-to-r from-brand-600/5 to-violet-600/5 p-5 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2.5 text-[15px] font-bold text-slate-900 dark:text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-violet-600 text-white">
              <LayoutTemplate size={16} />
            </span>
            Website Prototype
          </h2>
          {prototype && (
            <div className="flex items-center gap-2">
              <StatusBadge status={status} />
              {stale && (
                <span className="badge bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30">
                  <AlertTriangle size={11} /> Out of date
                </span>
              )}
              <span className="text-xs text-slate-400">
                {versions.length > 0 && `Version ${versions[versions.length - 1].number} · `}
                {sitemap.length} pages
              </span>
            </div>
          )}
        </div>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {prototype
            ? 'An AI-generated sitemap, page blueprints and interactive prototype — editable in the workspace and shareable with the client.'
            : 'Turn this client’s collected information into an AI-analyzed sitemap, page blueprints and a fully editable website prototype.'}
        </p>
      </div>

      {!prototype ? (
        <div className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">✨ Generate a website prototype</p>
            <p className="mt-0.5 text-xs text-slate-400">
              Uses only the information already collected — nothing is re-asked and nothing is invented.
            </p>
          </div>
          <Link to={`/clients/${client.id}/generate`} className="btn-primary shrink-0 !px-5 !py-2.5">
            <Sparkles size={16} /> Generate Website Prototype
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 p-5 lg:grid-cols-2">
          {/* Left column */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <InfoTile label="Prototype versions" value={String(versions.length)} />
              <InfoTile
                label="Approved"
                value={
                  approved
                    ? client.approval?.date
                      ? formatDate(client.approval.date)
                      : 'Yes'
                    : 'Pending'
                }
              />
              <InfoTile label="Theme" value={client.theme ? getTheme(client.theme)?.name ?? client.theme : '—'} />
              <InfoTile label="AI analysis" value={client.aiAnalysis ? 'Complete' : '—'} />
            </div>

            {sitemap.length > 0 && (
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">Sitemap</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {sitemap.map((p) => (
                    <span
                      key={p.id}
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    >
                      {p.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column — feedback + actions */}
          <div className="space-y-4">
            {feedback.length > 0 && (
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">Client feedback</p>
                <div className="mt-1.5 space-y-2">
                  {feedback.map((f) => (
                    <div
                      key={f.id}
                      className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-500/30 dark:bg-amber-500/10"
                    >
                      <p className="text-[13px] leading-relaxed text-slate-700 dark:text-slate-200">{f.text}</p>
                      <div className="mt-1.5 flex items-center gap-2 text-[11px] text-slate-400">
                        <span>{formatDate(f.date)}</span>
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                          {f.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stale && (
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 dark:border-amber-500/30 dark:bg-amber-500/10">
                <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-500" />
                <p className="text-[13px] leading-relaxed text-amber-800 dark:text-amber-300">
                  <span className="font-bold">This prototype is out of date.</span> The client's information changed
                  after it was generated. Regenerate to rebuild it from the latest answers — a new version is created
                  and the old ones stay in history.
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Link to={`/clients/${client.id}/prototype`} className="btn-primary btn-sm">
                <LayoutTemplate size={14} /> Open Workspace
              </Link>
              <Link to={`/clients/${client.id}/preview`} className="btn-secondary btn-sm">
                <Eye size={14} /> Client Preview
              </Link>
              <button onClick={onShare} className="btn-secondary btn-sm">
                <Share2 size={14} /> Copy Share Link
              </button>
              <Link
                to={`/clients/${client.id}/generate`}
                className={stale ? 'btn-primary btn-sm' : 'btn-ghost btn-sm'}
              >
                <Sparkles size={14} /> {stale ? 'Regenerate Prototype' : 'Regenerate'}
              </Link>
            </div>

            {versions.length > 1 && (
              <p className="flex items-center gap-1.5 text-xs text-slate-400">
                <History size={12} /> {versions.length} versions saved — restore any of them from the workspace.
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-3.5 py-3 dark:border-slate-800 dark:bg-slate-900/60">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 truncate text-sm font-bold text-slate-800 dark:text-slate-100">{value}</p>
    </div>
  );
}

/* ---------------- theme picker ---------------- */

function ThemePickerModal({
  open,
  currentThemeId,
  onClose,
  onPick,
}: {
  open: boolean;
  currentThemeId: string;
  onClose: () => void;
  onPick: (themeId: string) => void;
}) {
  const [preview, setPreview] = useState<ThemeWithPreview | null>(null);

  return (
    <>
      <Modal open={open} onClose={onClose} size="xl">
        <ModalHeader
          title="Choose a website theme"
          subtitle="Browse the six design directions. Selecting one stores it with this client."
          onClose={onClose}
        />
        <div className="grid gap-4 overflow-y-auto p-5 sm:grid-cols-2 lg:grid-cols-3">
          {THEMES.map((t) => {
            const active = t.id === currentThemeId;
            return (
              <button
                key={t.id}
                onClick={() => onPick(t.id)}
                onDoubleClick={() => setPreview(t)}
                className={cn(
                  'group relative overflow-hidden rounded-xl border text-left transition-all',
                  active
                    ? 'border-brand-500 ring-2 ring-brand-500/50'
                    : 'border-slate-200 hover:border-brand-300 hover:shadow-lift dark:border-slate-700'
                )}
              >
                <div className="pointer-events-none">
                  <ScaledPreview clipHeight={280} className="w-full border-b border-slate-100 dark:border-slate-800">
                    <t.preview />
                  </ScaledPreview>
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{t.name}</span>
                    {active && (
                      <span className={cn('badge', STATUS_META['Requirement Collected'].classes)}>
                        <Save size={11} /> Selected
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex gap-1">
                    {[t.palette.primary, t.palette.secondary, t.palette.accent].map((c, i) => (
                      <span key={i} className="h-2.5 w-2.5 rounded-full border border-slate-200 dark:border-slate-700" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
                <span className="absolute right-2 top-2 rounded-md bg-slate-950/70 px-2 py-1 text-[10px] font-semibold text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                  Preview
                </span>
              </button>
            );
          })}
        </div>
        <div className="border-t border-slate-100 p-4 text-center text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
          Tip: double-click any theme for a full live preview.
        </div>
      </Modal>

      {preview && (
        <ThemePreviewModal
          theme={preview}
          selectLabel="Use This Theme"
          onSelect={() => {
            onPick(preview.id);
            setPreview(null);
          }}
          onClose={() => setPreview(null)}
        />
      )}
    </>
  );
}