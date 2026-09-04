import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Check,
  CheckCircle2,
  Loader2,
  MessageSquare,
  Monitor,
  Palette,
  Smartphone,
  Sparkles,
  Tablet,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { PrototypeVersion } from '../types';
import PrototypeRenderer, { VIEWPORT_WIDTHS, type ViewportMode } from '../components/prototype/PrototypeRenderer';
import { ConfirmModal, Logo, Modal, ModalHeader } from '../components/ui';
import { Textarea } from '../components/form';
import { cn, uid } from '../lib/utils';
import { getTheme } from '../themes';

const VIEWPORT_OPTIONS: Array<{ value: ViewportMode; label: string; icon: typeof Monitor }> = [
  { value: 'desktop', label: 'Desktop', icon: Monitor },
  { value: 'tablet', label: 'Tablet', icon: Tablet },
  { value: 'mobile', label: 'Mobile', icon: Smartphone },
];

export default function ClientPreview() {
  const { projectId } = useParams<{ projectId: string }>();
  const { clients, updateClient, toast } = useApp();
  const client = clients.find((c) => c.id === projectId);

  const [viewport, setViewport] = useState<ViewportMode>('desktop');
  const [pageId, setPageId] = useState<string>(() => client?.prototype?.pages[0]?.id ?? '');
  const [approveOpen, setApproveOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!client) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
          <X size={36} className="mx-auto text-slate-600" />
          <h1 className="mt-4 text-xl font-bold text-white">Preview not found</h1>
          <p className="mt-2 text-sm text-slate-400">
            This preview link may be invalid or the project no longer exists. Please contact your agency.
          </p>
        </div>
      </div>
    );
  }

  const business = client.businessName || client.company || client.name || 'Website';
  const theme = client.theme ? getTheme(client.theme) : undefined;
  const approved = client.approval?.approved;

  const markVersionStatus = (status: PrototypeVersion['status']) => {
    const versions = client.prototypeVersions ?? [];
    if (versions.length === 0) return;
    const next = [...versions];
    next[next.length - 1] = { ...next[next.length - 1], status };
    updateClient(client.id, { prototypeVersions: next });
  };

  const handleApprove = () => {
    const last = client.prototypeVersions?.[client.prototypeVersions.length - 1];
    const versionNumber = last?.number ?? 1;
    updateClient(client.id, {
      approval: { approved: true, date: Date.now(), version: versionNumber },
      status: 'Prototype Approved',
    });
    /* The version that was current at approval time keeps its own historical
       status; later feedback or edits never rewrite it. */
    markVersionStatus('Prototype Approved');
    setApproveOpen(false);
    toast('Prototype approved — thank you! 🎉', 'success');
  };

  const handleFeedback = () => {
    const text = feedbackText.trim();
    if (!text) {
      toast('Please describe what you would like us to change.', 'warning');
      return;
    }
    setSubmitting(true);
    window.setTimeout(() => {
      updateClient(client.id, {
        feedback: [
          ...(client.feedback ?? []),
          { id: uid(), text, date: Date.now(), status: 'Open' },
        ],
        approval: client.approval?.approved ? { approved: false } : client.approval,
        status: 'Changes Requested',
      });
      /* Deliberately NOT rewriting the approved version's status: the project
         moves to "Changes Requested" but the approved version keeps its own
         historical meaning. New saves create a fresh version instead. */
      setSubmitting(false);
      setFeedbackOpen(false);
      setFeedbackText('');
      toast('Feedback sent — your agency has been notified.', 'success');
    }, 400);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <Logo compact />
          <div className="min-w-0">
            <div className="truncate text-sm font-bold">{business}</div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Sparkles size={11} className="text-indigo-400" /> Website prototype
            </div>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            {theme && (
              <span className="hidden items-center gap-1.5 rounded-full border border-slate-700 px-3 py-1 text-xs font-medium text-slate-300 sm:inline-flex">
                <Palette size={12} className="text-indigo-400" /> {theme.name}
              </span>
            )}
            {/* Client-facing status — never the internal workflow status. */}
            {approved ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400 ring-1 ring-inset ring-emerald-500/40">
                <CheckCircle2 size={12} /> Prototype Approved
              </span>
            ) : client.feedback && client.feedback.length > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-400 ring-1 ring-inset ring-amber-500/40">
                <MessageSquare size={12} /> Changes Requested
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-500/15 px-3 py-1 text-xs font-semibold text-slate-300 ring-1 ring-inset ring-slate-500/40">
                <Sparkles size={12} /> Awaiting review
              </span>
            )}

            {/* viewport */}
            <div className="flex items-center gap-0.5 rounded-xl border border-slate-800 bg-slate-900 p-1">
              {VIEWPORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setViewport(opt.value)}
                  className={cn(
                    'inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all',
                    viewport === opt.value ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  )}
                  aria-pressed={viewport === opt.value}
                >
                  <opt.icon size={14} />
                  <span className="hidden md:inline">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* action bar */}
        <div className="border-t border-slate-800/70">
          <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center justify-between gap-2 px-4 py-2.5 sm:px-6">
            <p className="text-xs text-slate-400">
              {approved
                ? 'Thank you — this prototype has been approved.'
                : 'Take a look at your website prototype. Navigate the pages and let us know what you think.'}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFeedbackOpen(true)}
                disabled={submitting}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-500 hover:bg-slate-900 disabled:opacity-50"
              >
                <MessageSquare size={15} /> Request Changes
              </button>
              <button
                onClick={() => setApproveOpen(true)}
                disabled={approved || submitting}
                className={cn(
                  'inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-60',
                  approved
                    ? 'bg-emerald-600/20 text-emerald-400 ring-1 ring-inset ring-emerald-500/40'
                    : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                )}
              >
                {approved ? <CheckCircle2 size={15} /> : <Check size={15} strokeWidth={3} />}
                {approved ? 'Approved' : 'Approve Prototype'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Pages strip */}
      {client.prototype && client.prototype.pages.length > 0 && (
        <div className="border-t border-slate-800/60 bg-slate-950">
          <div className="mx-auto flex w-full max-w-[1600px] items-center gap-1.5 overflow-x-auto px-4 py-2 scrollbar-none sm:px-6">
            {client.prototype.pages.map((p) => (
              <button
                key={p.id}
                onClick={() => setPageId(p.id)}
                className={cn(
                  'shrink-0 cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all',
                  pageId === p.id
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Preview */}
      <main className="flex-1 bg-slate-900/60">
        {client.prototype ? (
          <div className="flex min-h-[70vh] justify-center overflow-auto p-4 sm:p-8">
            <div
              className="h-fit overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-white/10 transition-all duration-300"
              style={{ width: VIEWPORT_WIDTHS[viewport] }}
            >
              <PrototypeRenderer
                snapshot={client.prototype}
                activePageId={pageId}
                viewport={viewport}
                interactive
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
            <Sparkles size={36} className="text-slate-600" />
            <h2 className="mt-4 text-lg font-bold">No prototype yet</h2>
            <p className="mt-2 max-w-sm text-sm text-slate-400">
              Your website prototype is being prepared. Check back soon!
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      {/* Note: this preview is a convenience view inside the same client-side
          app — it is NOT a secured public link. There is no authentication or
          backend in the current architecture, so the URL must not be treated
          as private. True secure sharing would require server-side auth. */}
      <footer className="border-t border-slate-800 py-4">
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-2 px-4 text-xs text-slate-500 sm:px-6">
          <span>Prepared with ClientFlow — AI-powered website planning &amp; prototyping</span>
          <span className="hidden sm:inline">Prototype preview</span>
        </div>
      </footer>

      {/* Approve confirm */}
      <ConfirmModal
        open={approveOpen}
        onClose={() => setApproveOpen(false)}
        title="Approve this prototype?"
        message="Are you sure you want to approve this prototype? Your agency will be notified and can begin the next steps."
        confirmLabel="Yes, approve"
        danger={false}
        onConfirm={handleApprove}
      />

      {/* Request changes */}
      <Modal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} size="md">
        <ModalHeader
          title="Request Changes"
          subtitle="Your feedback goes straight to your agency's project dashboard."
          onClose={() => setFeedbackOpen(false)}
        />
        <div className="px-6 py-5">
          <Textarea
            label="What would you like us to change?"
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="e.g. Could the hero section show our real products? The contact form should also ask for the city. We would like the colours to feel warmer…"
            className="min-h-[140px]"
            autoFocus
          />
          <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
            The project status will become “Changes Requested” and this feedback will be saved with the project.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setFeedbackOpen(false)} className="btn-ghost">
              <X size={15} /> Cancel
            </button>
            <button onClick={handleFeedback} disabled={submitting} className="btn-primary">
              {submitting ? <Loader2 size={15} className="animate-spin" /> : <MessageSquare size={15} />}
              Send feedback
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}