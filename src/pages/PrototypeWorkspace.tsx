import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  Clipboard,
  Copy,
  Eye,
  FilePlus2,
  History,
  LayoutTemplate,
  Loader2,
  Monitor,
  Pencil,
  Plus,
  Save,
  Share2,
  Smartphone,
  Redo2,
  Sparkles,
  Tablet,
  Trash2,
  Undo2,
  Wand2,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type {
  AIContext,
} from '../lib/ai';
import { getAIProvider } from '../lib/ai';
import type {
  Client,
  PrototypeDesign,
  PrototypePage,
  PrototypeSection,
  PrototypeSectionType,
  PrototypeSnapshot,
  PrototypeVersion,
} from '../types';
import {
  cloneSnapshot,
  createVersion,
  nextVersionNumber,
  versionStatusFor,
} from '../lib/generator';
import {
  SECTION_TYPE_LABELS,
  SECTION_TYPE_ORDER,
  applyThemeChange,
  createSection,
  newPage,
  type SectionContext,
} from '../lib/prototypeSections';
import PrototypeRenderer, { VIEWPORT_WIDTHS, type ViewportMode } from '../components/prototype/PrototypeRenderer';
import SectionEditModal from '../components/prototype/SectionEditModal';
import VersionHistoryModal from '../components/prototype/VersionHistoryModal';
import { ConfirmModal, EmptyState, Modal, ModalHeader } from '../components/ui';
import { cn, formatDate } from '../lib/utils';
import { isPrototypeStale, sourceFingerprint } from '../lib/staleness';
import { THEMES } from '../themes';

const VIEWPORT_OPTIONS: Array<{ value: ViewportMode; label: string; icon: typeof Monitor }> = [
  { value: 'desktop', label: 'Desktop', icon: Monitor },
  { value: 'tablet', label: 'Tablet', icon: Tablet },
  { value: 'mobile', label: 'Mobile', icon: Smartphone },
];

function SectionButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  busy,
}: {
  icon: typeof Sparkles;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  busy?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || busy}
      className="flex w-full cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-[13px] font-semibold text-slate-600 transition-all hover:border-brand-300 hover:bg-brand-50/50 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-brand-500/40 dark:hover:bg-brand-500/10 dark:hover:text-brand-300"
    >
      {busy ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} className="text-brand-500" />}
      {label}
    </button>
  );
}

export default function PrototypeWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { clients, settings, updateClient, toast } = useApp();
  const client = clients.find((c) => c.id === id);

  const [snapshot, setSnapshot] = useState<PrototypeSnapshot | null>(() =>
    client?.prototype ? cloneSnapshot(client.prototype) : null
  );
  const [activePageId, setActivePageId] = useState<string>(() => client?.prototype?.pages[0]?.id ?? '');
  const [viewport, setViewport] = useState<ViewportMode>('desktop');
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [editSection, setEditSection] = useState<PrototypeSection | null>(null);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [seoTitle, setSeoTitle] = useState<string | null>(null);
  const [renamingPageId, setRenamingPageId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [pendingDeletePage, setPendingDeletePage] = useState<PrototypePage | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const pendingLeave = useRef<string | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [historyPast, setHistoryPast] = useState<PrototypeSnapshot[]>([]);
  const [historyFuture, setHistoryFuture] = useState<PrototypeSnapshot[]>([]);
  const restoringRef = useRef(false);
  const prevSnapshotRef = useRef<PrototypeSnapshot | null>(null);
  const autosaveTimer = useRef<number | null>(null);
  const savedResetTimer = useRef<number | null>(null);

  const ai = useMemo(() => getAIProvider(settings), [settings]);

  const activePage = useMemo(
    () => snapshot?.pages.find((p) => p.id === activePageId) ?? snapshot?.pages[0],
    [snapshot, activePageId]
  );
  const selectedSection =
    activePage?.sections.find((s) => s.id === selectedSectionId) ?? null;

  const savedSnapshot = client?.prototype;
  const dirty =
    !!snapshot && !!savedSnapshot && JSON.stringify(snapshot) !== JSON.stringify(savedSnapshot);
  const lastVersion = client?.prototypeVersions?.length
    ? client.prototypeVersions[client.prototypeVersions.length - 1]
    : undefined;
  const stale = client ? isPrototypeStale(client) : false;

  /* Backfill the source fingerprint for prototypes generated before this
     feature existed, so future client edits are correctly detected as stale. */
  useEffect(() => {
    const c = clients.find((x) => x.id === id);
    if (c?.prototype && !c.prototypeSourceHash) {
      updateClient(c.id, { prototypeSourceHash: sourceFingerprint(c) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Warn when leaving with unsaved changes (tab close/refresh + in-app exit). */
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  /* Undo/redo history — record every snapshot change except restores. */
  useEffect(() => {
    if (!snapshot) return;
    if (restoringRef.current) {
      restoringRef.current = false;
      prevSnapshotRef.current = snapshot;
      return;
    }
    const prev = prevSnapshotRef.current;
    prevSnapshotRef.current = snapshot;
    if (!prev || JSON.stringify(prev) === JSON.stringify(snapshot)) return;
    setHistoryPast((p) => [...p.slice(-49), prev]);
    setHistoryFuture([]);
  }, [snapshot]);

  /* Autosave — persist edits shortly after they happen (no version created;
     explicit Save still creates versions). Never loses user edits. */
  useEffect(() => {
    if (!snapshot) return;
    const saved = client?.prototype;
    if (saved && JSON.stringify(snapshot) === JSON.stringify(saved)) {
      setSaveState('idle');
      return;
    }
    setSaveState('saving');
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    autosaveTimer.current = window.setTimeout(() => {
      autosaveTimer.current = null;
      persistPrototype(snapshot, false);
    }, 900);
    return () => {
      if (autosaveTimer.current) {
        window.clearTimeout(autosaveTimer.current);
        autosaveTimer.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot]);

  /* Keyboard shortcuts: Ctrl/Cmd+Z undo, Ctrl/Cmd+Shift+Z or Ctrl+Y redo. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      const k = e.key.toLowerCase();
      if ((k === 'z' && e.shiftKey) || k === 'y') {
        e.preventDefault();
        redo();
      } else if (k === 'z') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyPast, historyFuture, snapshot]);

  const requestLeave = (to: string) => {
    if (dirty) {
      pendingLeave.current = to;
      setLeaveOpen(true);
    } else {
      navigate(to);
    }
  };

  if (!client) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="card max-w-lg px-6 py-16 text-center">
          <LayoutTemplate size={40} className="mx-auto text-slate-300 dark:text-slate-600" />
          <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">Client not found</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            This client may have been deleted.
          </p>
          <Link to="/clients" className="btn-primary mt-6">
            <ArrowLeft size={16} /> Back to clients
          </Link>
        </div>
      </div>
    );
  }

  const business = client.businessName || client.company || client.name || 'Your Business';
  const shareUrl = `${window.location.href.split('#')[0]}#/preview/${client.id}`;

  if (!snapshot || !activePage) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <EmptyState
          icon={LayoutTemplate}
          title="Your website prototype hasn't been generated yet"
          description="Generate it from the client's collected information — analysis, sitemap, page blueprints and an interactive theme-aware prototype will be created automatically."
          action={
            <Link to={`/clients/${client.id}/generate`} className="btn-primary">
              <Sparkles size={16} /> Generate Website Prototype
            </Link>
          }
        />
      </div>
    );
  }

  /* ---------------- design helpers ---------------- */

  const setDesign = (patch: Partial<PrototypeDesign>) => {
    setSnapshot((prev) => (prev ? { ...prev, design: { ...prev.design, ...patch } } : prev));
  };

  const updatePage = (pageId: string, fn: (page: PrototypePage) => PrototypePage) => {
    setSnapshot((prev) =>
      prev ? { ...prev, pages: prev.pages.map((p) => (p.id === pageId ? fn(p) : p)) } : prev
    );
  };

  const sectionCtx: SectionContext = {
    business,
    industry: client.industry,
    description: client.description,
    projectGoal: client.projectGoal,
    targetAudience: client.targetAudience,
    features: [...client.features, ...client.customFeatures],
    notes: client.notes,
    theme: snapshot.design.theme,
    pageLabel: activePage.label,
    websiteType: client.projectType,
    dynamicAnswers: client.dynamicAnswers ?? null,
  };

  const aiCtx = (section?: PrototypeSection | null): AIContext => ({
    business,
    industry: client.industry,
    description: client.description,
    projectGoal: client.projectGoal,
    targetAudience: client.targetAudience,
    theme: snapshot.design.theme,
    pageLabel: activePage.label,
    sectionType: section?.type ?? 'hero',
    sectionTitle: section?.title ?? activePage.label,
    sectionSubtitle: section?.subtitle ?? '',
  });

  /* ---------------- section operations ---------------- */

  const addSection = (type: PrototypeSectionType) => {
    const section = createSection(type, sectionCtx);
    updatePage(activePage.id, (p) => ({ ...p, sections: [...p.sections, section] }));
    setSelectedSectionId(section.id);
    setAddSectionOpen(false);
  };

  const addPage = () => {
    const page = newPage(`Page ${snapshot.pages.length + 1}`);
    const hero = createSection('hero', { ...sectionCtx, pageLabel: page.label });
    const text = createSection('text', { ...sectionCtx, pageLabel: page.label });
    const cta = createSection('cta', { ...sectionCtx, pageLabel: page.label });
    const full: PrototypePage = { ...page, sections: [hero, text, cta] };
    setSnapshot((prev) => (prev ? { ...prev, pages: [...prev.pages, full] } : prev));
    setActivePageId(page.id);
    setSelectedSectionId(null);
  };

  const startRename = (page: PrototypePage) => {
    setRenamingPageId(page.id);
    setRenameValue(page.label);
  };

  const commitRename = () => {
    const clean = renameValue.trim();
    if (renamingPageId && clean) {
      setSnapshot((prev) =>
        prev
          ? { ...prev, pages: prev.pages.map((p) => (p.id === renamingPageId ? { ...p, label: clean } : p)) }
          : prev
      );
    }
    setRenamingPageId(null);
    setRenameValue('');
  };

  const deletePage = (pageId: string) => {
    if (snapshot.pages.length <= 1) return;
    const idx = snapshot.pages.findIndex((p) => p.id === pageId);
    const remaining = snapshot.pages.filter((p) => p.id !== pageId);
    setSnapshot((prev) => (prev ? { ...prev, pages: remaining } : prev));
    if (activePageId === pageId) {
      setActivePageId(remaining[Math.max(0, idx - 1)]?.id ?? remaining[0]?.id ?? '');
    }
    setSelectedSectionId(null);
    setEditSection(null);
    setPendingDeletePage(null);
  };

  const updateSection = (sectionId: string, patch: Partial<PrototypeSection>) => {
    updatePage(activePage.id, (p) => ({
      ...p,
      sections: p.sections.map((s) => (s.id === sectionId ? { ...s, ...patch } : s)),
    }));
  };

  const removeSection = (sectionId: string) => {
    updatePage(activePage.id, (p) => ({
      ...p,
      sections: p.sections.filter((s) => s.id !== sectionId),
    }));
    setSelectedSectionId(null);
    setEditSection(null);
  };

  const duplicateSection = (sectionId: string) => {
    updatePage(activePage.id, (p) => {
      const idx = p.sections.findIndex((s) => s.id === sectionId);
      if (idx === -1) return p;
      const copy = JSON.parse(JSON.stringify(p.sections[idx])) as PrototypeSection;
      copy.id = `${copy.id}-copy-${Date.now()}`;
      const sections = [...p.sections];
      sections.splice(idx + 1, 0, copy);
      return { ...p, sections };
    });
  };

  const moveSection = (sectionId: string, dir: -1 | 1) => {
    updatePage(activePage.id, (p) => {
      const idx = p.sections.findIndex((s) => s.id === sectionId);
      const target = idx + dir;
      if (idx === -1 || target < 0 || target >= p.sections.length) return p;
      const sections = [...p.sections];
      [sections[idx], sections[target]] = [sections[target], sections[idx]];
      return { ...p, sections };
    });
  };

  /* ---------------- persistence ---------------- */

  /* Writes the current prototype to the client record, keeping the stored
     sitemap and page blueprints in sync. `makeVersion` additionally appends
     a version-history entry (explicit Save / Approve); autosave persists
     without one. */
  const persistPrototype = (
    snap: PrototypeSnapshot,
    makeVersion: boolean,
    versionStatus?: PrototypeVersion['status']
  ) => {
    const versions = client.prototypeVersions ?? [];
    const existingBlueprints = client.pageBlueprints ?? [];
    const pageIds = new Set(snap.pages.map((p) => p.id));
    const syncedBlueprints = existingBlueprints
      .filter((b) => pageIds.has(b.pageId))
      .map((b) => {
        const page = snap.pages.find((p) => p.id === b.pageId);
        return page ? { ...b, pageName: page.label } : b;
      });
    const patch: Partial<Client> = {
      prototype: cloneSnapshot(snap),
      sitemap: snap.pages.map((p) => ({ id: p.id, label: p.label })),
      pageBlueprints: syncedBlueprints,
    };
    if (makeVersion) {
      patch.prototypeVersions = [
        ...versions,
        {
          ...createVersion(snap, versionStatus ?? versionStatusFor(client.status)),
          number: nextVersionNumber(versions),
          note: 'Edited in prototype workspace',
        },
      ];
    }
    updateClient(client.id, patch);
    setSaveState('saved');
    if (savedResetTimer.current) window.clearTimeout(savedResetTimer.current);
    savedResetTimer.current = window.setTimeout(() => setSaveState('idle'), 1600);
  };

  const handleSave = (): PrototypeVersion | undefined => {
    if (!snapshot) return undefined;
    const versions = client.prototypeVersions ?? [];
    const version: PrototypeVersion = {
      ...createVersion(snapshot, versionStatusFor(client.status)),
      number: nextVersionNumber(versions),
      note: 'Edited in prototype workspace',
    };
    persistPrototype(snapshot, true);
    toast(`Prototype saved as Version ${version.number}.`);
    return version;
  };

  /* Undo / redo over the in-memory snapshot history. Restores do not get
     recorded again, and the restored state is autosaved like any edit. */
  const undo = () => {
    if (historyPast.length === 0 || !snapshot) return;
    const prev = historyPast[historyPast.length - 1];
    setHistoryPast((p) => p.slice(0, -1));
    setHistoryFuture((f) => [...f, snapshot]);
    restoringRef.current = true;
    setSnapshot(cloneSnapshot(prev));
    setActivePageId((cur) => (prev.pages.some((p) => p.id === cur) ? cur : prev.pages[0]?.id ?? ''));
    setSelectedSectionId(null);
    setEditSection(null);
  };

  const redo = () => {
    if (historyFuture.length === 0 || !snapshot) return;
    const next = historyFuture[historyFuture.length - 1];
    setHistoryFuture((f) => f.slice(0, -1));
    setHistoryPast((p) => [...p, snapshot]);
    restoringRef.current = true;
    setSnapshot(cloneSnapshot(next));
    setActivePageId((cur) => (next.pages.some((p) => p.id === cur) ? cur : next.pages[0]?.id ?? ''));
    setSelectedSectionId(null);
    setEditSection(null);
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast('Client preview link copied to clipboard.');
    } catch {
      toast('Could not copy — preview link: ' + shareUrl, 'info');
    }
  };

  const handleApprove = () => {
    let version = lastVersion;
    if (dirty && snapshot) {
      /* Approving unsaved work saves it first — the newly created version is
         the approved one, so it carries the 'Prototype Approved' status. */
      const versions = client.prototypeVersions ?? [];
      const v: PrototypeVersion = {
        ...createVersion(snapshot, 'Prototype Approved'),
        number: nextVersionNumber(versions),
        note: 'Approved in prototype workspace',
      };
      persistPrototype(snapshot, true, 'Prototype Approved');
      version = v;
    }
    updateClient(client.id, {
      approval: { approved: true, date: Date.now(), version: version?.number ?? 1 },
      status: 'Prototype Approved',
    });
    setApproveOpen(false);
    toast('Prototype approved. 🎉', 'success');
  };

  const handleRestore = (version: PrototypeVersion) => {
    setSnapshot(cloneSnapshot(version.data));
    const firstPage = version.data.pages[0];
    setActivePageId(firstPage?.id ?? '');
    setSelectedSectionId(null);
    setEditSection(null);
    toast(`Restored Version ${version.number}. Save to keep it.`, 'info');
  };

  /* ---------------- AI assistance ---------------- */

  const runAi = async (fn: () => Promise<void>) => {
    if (aiBusy) return;
    setAiBusy(true);
    try {
      await fn();
    } finally {
      setAiBusy(false);
    }
  };

  const aiImproveCopy = (section: PrototypeSection) =>
    runAi(async () => {
      const result = await ai.improveCopy(section.subtitle || section.title, aiCtx(section));
      if (section.subtitle) updateSection(section.id, { subtitle: result });
      else updateSection(section.id, { title: result, subtitle: section.subtitle });
      toast('Copy improved ✨', 'success');
    });

  const aiRewriteHeading = (section: PrototypeSection) =>
    runAi(async () => {
      const result = await ai.rewriteHeading(section.title, aiCtx(section));
      updateSection(section.id, { title: result });
      toast('Heading rewritten ✨', 'success');
    });

  const aiGenerateCta = (section: PrototypeSection) =>
    runAi(async () => {
      const result = await ai.generateCta(aiCtx(section));
      updateSection(section.id, { cta: { label: result, href: section.cta?.href } });
      toast('CTA generated ✨', 'success');
    });

  const aiImproveUx = (section: PrototypeSection) =>
    runAi(async () => {
      const result = await ai.improveUx(aiCtx(section));
      toast(result, 'info');
    });

  const aiSuggestSection = () =>
    runAi(async () => {
      const result = await ai.suggestSection(aiCtx(selectedSection));
      const section = createSection(result.type, sectionCtx);
      section.title = result.title;
      section.subtitle = result.subtitle;
      updatePage(activePage.id, (p) => ({ ...p, sections: [...p.sections, section] }));
      setSelectedSectionId(section.id);
      toast(`Suggested ${SECTION_TYPE_LABELS[result.type]} section added ✨`, 'success');
    });

  const aiSeoTitle = () =>
    runAi(async () => {
      const result = await ai.generateSeoTitle(aiCtx());
      setSeoTitle(result);
    });

  /* ---------------- render ---------------- */

  const colors = snapshot.design.colors;
  const colorFields: Array<{ key: keyof typeof colors; label: string }> = [
    { key: 'bg', label: 'Background' },
    { key: 'surface', label: 'Surface / cards' },
    { key: 'text', label: 'Text' },
    { key: 'muted', label: 'Muted text' },
    { key: 'primary', label: 'Primary' },
    { key: 'secondary', label: 'Secondary' },
    { key: 'accent', label: 'Accent' },
  ];

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-100 dark:bg-slate-950">
      {/* ---------------- Top bar ---------------- */}
      <header className="z-30 flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900 sm:px-4">
        <button
          onClick={() => requestLeave(`/clients/${client.id}`)}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-brand-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-brand-400"
        >
          <ArrowLeft size={16} /> <span className="hidden sm:inline">Client</span>
        </button>
        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-slate-900 dark:text-white">
            Prototype — {business}
          </div>
          <div className="hidden text-[11px] text-slate-400 sm:block">
            {activePage.label} · {snapshot.design.theme} ·{' '}
            {lastVersion ? `Version ${lastVersion.number}` : 'Unsaved'}
            {dirty && <span className="ml-1 font-bold text-amber-500">· unsaved changes</span>}
            {stale && <span className="ml-1 font-bold text-amber-500">· out of date — regenerate</span>}
          </div>
        </div>

        {/* Undo / redo + autosave status */}
        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={undo}
            disabled={historyPast.length === 0}
            className="icon-btn !h-8 !w-8 disabled:cursor-not-allowed disabled:opacity-40"
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
          >
            <Undo2 size={15} />
          </button>
          <button
            onClick={redo}
            disabled={historyFuture.length === 0}
            className="icon-btn !h-8 !w-8 disabled:cursor-not-allowed disabled:opacity-40"
            title="Redo (Ctrl+Shift+Z)"
            aria-label="Redo"
          >
            <Redo2 size={15} />
          </button>
          <span
            className={cn(
              'hidden w-16 text-right text-[11px] font-semibold sm:block',
              saveState === 'saving' ? 'text-slate-400' : saveState === 'saved' ? 'text-emerald-500' : ''
            )}
            aria-live="polite"
          >
            {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved ✓' : ''}
          </span>
        </div>

        {/* Viewport control */}
        <div className="flex items-center gap-0.5 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800">
          {VIEWPORT_OPTIONS.map((opt) => {
            const active = viewport === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setViewport(opt.value)}
                className={cn(
                  'inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all',
                  active ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                )}
                aria-pressed={active}
              >
                <opt.icon size={14} />
                <span className="hidden md:inline">{opt.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5">
          <button onClick={() => requestLeave(`/clients/${client.id}/preview`)} className="btn-secondary btn-sm">
            <Eye size={14} /> <span className="hidden sm:inline">Preview</span>
          </button>
          <button onClick={handleShare} className="btn-secondary btn-sm" title="Copy client preview link">
            <Share2 size={14} /> <span className="hidden sm:inline">Share</span>
          </button>
          <button onClick={handleSave} className="btn-secondary btn-sm" title="Save a new version">
            <Save size={14} /> <span className="hidden sm:inline">Save</span>
          </button>
          <button
            onClick={() => setApproveOpen(true)}
            disabled={client.approval?.approved}
            className="btn-primary btn-sm disabled:opacity-60"
            title="Approve prototype"
          >
            <Check size={14} /> <span className="hidden sm:inline">Approve</span>
          </button>
        </div>
      </header>

      {/* ---------------- Stale banner ---------------- */}
      {stale && (
        <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2.5 dark:border-amber-500/30 dark:bg-amber-500/10">
          <span className="flex items-center gap-2 text-[13px] font-semibold text-amber-800 dark:text-amber-300">
            <AlertTriangle size={15} /> Prototype is out of date
          </span>
          <span className="text-xs text-amber-700 dark:text-amber-400">
            The client's information changed after this prototype was generated. The old version stays viewable —
            regenerate to rebuild it from the latest answers (a new version is created; nothing is deleted).
          </span>
          <Link to={`/clients/${client.id}/generate`} className="btn-primary btn-sm ml-auto shrink-0">
            <Sparkles size={13} /> Regenerate Prototype
          </Link>
        </div>
      )}

      {/* ---------------- Body ---------------- */}
      <div className="flex min-h-0 flex-1 overflow-x-auto">
        {/* Left — pages */}
        <aside className="flex w-56 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Pages</span>
            <button onClick={addPage} className="icon-btn !h-7 !w-7" title="Add page" aria-label="Add page">
              <Plus size={15} />
            </button>
          </div>
          <div className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
            {snapshot.pages.map((p) => {
              const active = p.id === activePage.id;
              if (renamingPageId === p.id) {
                return (
                  <div key={p.id} className="flex items-center gap-1.5">
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitRename();
                        if (e.key === 'Escape') setRenamingPageId(null);
                      }}
                      onBlur={commitRename}
                      aria-label={`Rename ${p.label}`}
                      className="input w-full py-1.5 text-[13px]"
                    />
                  </div>
                );
              }
              return (
                <div
                  key={p.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setActivePageId(p.id);
                    setSelectedSectionId(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setActivePageId(p.id);
                      setSelectedSectionId(null);
                    }
                  }}
                  className={cn(
                    'group flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] font-semibold transition-all',
                    active
                      ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/25'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  )}
                >
                  <FilePlus2 size={14} className={active ? 'text-white/80' : 'text-slate-400'} />
                  <span className="min-w-0 flex-1 truncate">{p.label}</span>
                  <span className={cn('text-[10px] font-bold', active ? 'text-white/70' : 'text-slate-300 dark:text-slate-600')}>
                    {p.sections.length}
                  </span>
                  <span className={cn('flex items-center gap-0.5', active ? 'opacity-100' : 'opacity-0 transition-opacity group-hover:opacity-100')}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startRename(p);
                      }}
                      className={cn('icon-btn !h-6 !w-6', active ? 'text-white hover:bg-white/20 hover:text-white' : '')}
                      title="Rename page"
                      aria-label={`Rename ${p.label}`}
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingDeletePage(p);
                      }}
                      disabled={snapshot.pages.length <= 1}
                      className={cn('icon-btn !h-6 !w-6 disabled:opacity-30', active ? 'text-white hover:bg-white/20 hover:text-white' : 'hover:!bg-red-50 hover:!text-red-600 dark:hover:!bg-red-500/10 dark:hover:!text-red-400')}
                      title={snapshot.pages.length <= 1 ? 'Cannot delete the only page' : 'Delete page'}
                      aria-label={`Delete ${p.label}`}
                    >
                      <Trash2 size={12} />
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
          <div className="border-t border-slate-200 px-4 py-3 dark:border-slate-800">
            <button onClick={() => setVersionsOpen(true)} className="btn-secondary w-full btn-sm">
              <History size={13} /> Version History
            </button>
          </div>
        </aside>

        {/* Center — live preview */}
        <main className="flex min-w-0 flex-1 flex-col bg-slate-200/70 dark:bg-slate-900">
          <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-900">
            <span className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>
            <span className="ml-2 flex-1 truncate rounded-md bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-400 dark:bg-slate-800">
              {shareUrl}
            </span>
            <span className="text-[11px] font-semibold text-slate-400">
              {VIEWPORT_WIDTHS[viewport]}px
            </span>
          </div>
          <div
            className="flex-1 overflow-auto p-4 sm:p-8"
            onClick={() => setSelectedSectionId(null)}
          >
            <div
              className="mx-auto overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-slate-900/10 transition-all duration-300"
              style={{ width: VIEWPORT_WIDTHS[viewport] }}
              onClick={(e) => e.stopPropagation()}
            >
              <PrototypeRenderer
                snapshot={snapshot}
                activePageId={activePage.id}
                viewport={viewport}
                editing
                selectedSectionId={selectedSectionId}
                onSelectSection={setSelectedSectionId}
                onNavigate={(pageId) => setActivePageId(pageId)}
                features={[...client.features, ...client.customFeatures]}
                websiteType={client.projectType}
              />
            </div>
          </div>
        </main>

        {/* Right — design & section controls */}
        <aside className="flex w-80 shrink-0 flex-col border-l border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex-1 space-y-5 overflow-y-auto p-4">
            {/* Design controls */}
            <section>
              <h3 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Design Controls
              </h3>

              <div className="space-y-4">
                {/* Theme */}
                <div>
                  <label className="label">Theme</label>
                  <select
                    value={snapshot.design.theme}
                    onChange={(e) => setDesign(applyThemeChange(snapshot.design, e.target.value))}
                    className="input cursor-pointer py-2 text-[13px]"
                  >
                    {THEMES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Colors */}
                <div className="grid grid-cols-2 gap-x-3 gap-y-3">
                  {colorFields.map((f) => (
                    <div key={f.key} className="flex items-center gap-2">
                      <label
                        className="relative h-8 w-8 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700"
                        style={{ backgroundColor: colors[f.key] }}
                        title={f.label}
                      >
                        <input
                          type="color"
                          value={colors[f.key]}
                          onChange={(e) => setDesign({ colors: { ...colors, [f.key]: e.target.value } })}
                          className="absolute inset-0 cursor-pointer opacity-0"
                          aria-label={f.label}
                        />
                      </label>
                      <span className="min-w-0 text-xs font-medium text-slate-500 dark:text-slate-400">
                        <span className="block truncate">{f.label}</span>
                        <span className="block font-mono text-[10px] uppercase text-slate-400">{colors[f.key]}</span>
                      </span>
                    </div>
                  ))}
                </div>

                {/* Typography */}
                <div>
                  <label className="label">Typography</label>
                  <select
                    value={snapshot.design.font}
                    onChange={(e) => setDesign({ font: e.target.value as PrototypeDesign['font'] })}
                    className="input cursor-pointer py-2 text-[13px]"
                  >
                    <option value="sans">Modern Sans</option>
                    <option value="serif">Editorial Serif</option>
                    <option value="display">Bold Display</option>
                  </select>
                </div>

                {/* Buttons */}
                <div>
                  <label className="label">Buttons</label>
                  <select
                    value={snapshot.design.buttons}
                    onChange={(e) => setDesign({ buttons: e.target.value as PrototypeDesign['buttons'] })}
                    className="input cursor-pointer py-2 text-[13px]"
                  >
                    <option value="solid">Solid</option>
                    <option value="outline">Outline</option>
                    <option value="soft">Soft</option>
                    <option value="pill">Pill</option>
                  </select>
                </div>

                {/* Spacing */}
                <div>
                  <label className="label">Spacing</label>
                  <select
                    value={snapshot.design.spacing}
                    onChange={(e) => setDesign({ spacing: e.target.value as PrototypeDesign['spacing'] })}
                    className="input cursor-pointer py-2 text-[13px]"
                  >
                    <option value="compact">Compact</option>
                    <option value="comfortable">Comfortable</option>
                    <option value="spacious">Spacious</option>
                  </select>
                </div>

                {/* Button radius */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="label !mb-0">Button radius</label>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {snapshot.design.radius}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={28}
                    value={snapshot.design.radius}
                    onChange={(e) => setDesign({ radius: Number(e.target.value) })}
                    className="w-full cursor-pointer accent-indigo-600"
                    aria-label="Button radius"
                  />
                </div>

                {/* Card radius */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="label !mb-0">Card radius</label>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {snapshot.design.cardRadius ?? snapshot.design.radius}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={28}
                    value={snapshot.design.cardRadius ?? snapshot.design.radius}
                    onChange={(e) => setDesign({ cardRadius: Number(e.target.value) })}
                    className="w-full cursor-pointer accent-indigo-600"
                    aria-label="Card radius"
                  />
                </div>

                {/* Container width */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="label !mb-0">Container width</label>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {snapshot.design.containerWidth ? `${snapshot.design.containerWidth}px` : 'Full'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1440}
                    step={40}
                    value={snapshot.design.containerWidth || 0}
                    onChange={(e) => setDesign({ containerWidth: Number(e.target.value) })}
                    className="w-full cursor-pointer accent-indigo-600"
                    aria-label="Container width"
                  />
                </div>

                {/* Heading scale */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="label !mb-0">Heading size</label>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {Math.round((snapshot.design.headingScale ?? 1) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.8}
                    max={1.3}
                    step={0.05}
                    value={snapshot.design.headingScale ?? 1}
                    onChange={(e) => setDesign({ headingScale: Number(e.target.value) })}
                    className="w-full cursor-pointer accent-indigo-600"
                    aria-label="Heading size"
                  />
                </div>

                {/* Body size */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="label !mb-0">Body text size</label>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {snapshot.design.bodySize ?? 16}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min={13}
                    max={18}
                    step={0.5}
                    value={snapshot.design.bodySize ?? 16}
                    onChange={(e) => setDesign({ bodySize: Number(e.target.value) })}
                    className="w-full cursor-pointer accent-indigo-600"
                    aria-label="Body text size"
                  />
                </div>
              </div>
            </section>

            {/* Section controls */}
            <section className="border-t border-slate-100 pt-5 dark:border-slate-800">
              <h3 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Section Controls
              </h3>

              {selectedSection ? (
                <div className="space-y-3">
                  <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-3 dark:border-brand-500/30 dark:bg-brand-500/10">
                    <div className="text-sm font-bold text-slate-900 dark:text-white">{selectedSection.title}</div>
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">
                      {SECTION_TYPE_LABELS[selectedSection.type]}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <button onClick={() => setEditSection(selectedSection)} className="btn-secondary btn-sm col-span-2">
                      <Pencil size={13} /> Edit section
                    </button>
                    <button onClick={() => moveSection(selectedSection.id, -1)} className="btn-secondary btn-sm">
                      <ArrowUp size={13} /> Up
                    </button>
                    <button onClick={() => moveSection(selectedSection.id, 1)} className="btn-secondary btn-sm">
                      <ArrowDown size={13} /> Down
                    </button>
                    <button onClick={() => duplicateSection(selectedSection.id)} className="btn-secondary btn-sm">
                      <Copy size={13} /> Duplicate
                    </button>
                    <button
                      onClick={() => removeSection(selectedSection.id)}
                      className="btn btn-sm border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
                    >
                      <Trash2 size={13} /> Remove
                    </button>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">AI assistance</p>
                    <SectionButton icon={Wand2} label="Improve Copy" onClick={() => aiImproveCopy(selectedSection)} busy={aiBusy} />
                    <SectionButton icon={Wand2} label="Rewrite Heading" onClick={() => aiRewriteHeading(selectedSection)} busy={aiBusy} />
                    <SectionButton icon={Wand2} label="Generate CTA" onClick={() => aiGenerateCta(selectedSection)} busy={aiBusy} />
                    <SectionButton icon={Wand2} label="Improve UX" onClick={() => aiImproveUx(selectedSection)} busy={aiBusy} />
                    <SectionButton icon={Sparkles} label="Suggest Section" onClick={aiSuggestSection} busy={aiBusy} />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs leading-relaxed text-slate-400 dark:text-slate-500">
                    Select a section in the preview to edit it, or add a new section to{' '}
                    <span className="font-semibold text-slate-600 dark:text-slate-300">{activePage.label}</span>.
                  </p>
                  <div className="relative">
                    <button onClick={() => setAddSectionOpen((v) => !v)} className="btn-secondary w-full btn-sm">
                      <Plus size={14} /> Add Section
                    </button>
                    {addSectionOpen && (
                      <div className="absolute right-0 z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-800">
                        {SECTION_TYPE_ORDER.map((type) => (
                          <button
                            key={type}
                            onClick={() => addSection(type)}
                            className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] font-medium text-slate-600 transition-colors hover:bg-brand-50 hover:text-brand-700 dark:text-slate-300 dark:hover:bg-brand-500/10 dark:hover:text-brand-300"
                          >
                            <Plus size={13} className="text-slate-400" />
                            {SECTION_TYPE_LABELS[type]}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <SectionButton icon={Sparkles} label="Generate SEO Title" onClick={aiSeoTitle} busy={aiBusy} />
                </div>
              )}
            </section>

            {/* Feedback from client */}
            {client.feedback && client.feedback.length > 0 && (
              <section className="border-t border-slate-100 pt-5 dark:border-slate-800">
                <h3 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  Client Feedback
                </h3>
                <div className="space-y-2.5">
                  {client.feedback.map((f) => (
                    <div key={f.id} className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-500/30 dark:bg-amber-500/10">
                      <p className="text-[13px] leading-relaxed text-slate-700 dark:text-slate-200">{f.text}</p>
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
                        <span>{formatDate(f.date)}</span>
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                          {f.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* AI provider note */}
          <div className="border-t border-slate-200 px-4 py-2.5 dark:border-slate-800">
            <p className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
              <Sparkles size={11} className="text-brand-500" />
              AI: {ai.label}
            </p>
          </div>
        </aside>
      </div>

      {/* ---------------- Modals ---------------- */}
      {editSection && (
        <SectionEditModal
          section={editSection}
          onClose={() => setEditSection(null)}
          onSave={(section) => {
            updateSection(section.id, section);
            setEditSection(null);
          }}
        />
      )}

      {versionsOpen && (
        <VersionHistoryModal
          versions={client.prototypeVersions ?? []}
          onRestore={handleRestore}
          onClose={() => setVersionsOpen(false)}
        />
      )}

      <ConfirmModal
        open={approveOpen}
        onClose={() => setApproveOpen(false)}
        title="Approve this prototype?"
        message="Are you sure you want to approve this prototype? The client will see it in their preview and the project status will become “Prototype Approved”."
        confirmLabel="Approve prototype"
        danger={false}
        onConfirm={handleApprove}
      />

      {/* Delete page confirm */}
      <ConfirmModal
        open={pendingDeletePage !== null}
        onClose={() => setPendingDeletePage(null)}
        title={`Delete “${pendingDeletePage?.label ?? ''}”?`}
        message="This page and its sections will be removed from the prototype. Save afterwards to keep the change."
        confirmLabel="Delete page"
        onConfirm={() => pendingDeletePage && deletePage(pendingDeletePage.id)}
      />

      {/* Unsaved changes guard */}
      <ConfirmModal
        open={leaveOpen}
        onClose={() => {
          setLeaveOpen(false);
          pendingLeave.current = null;
        }}
        title="Discard unsaved changes?"
        message="You have unsaved prototype changes. Leave without saving? They will be lost."
        confirmLabel="Leave without saving"
        onConfirm={() => {
          const to = pendingLeave.current ?? `/clients/${client.id}`;
          pendingLeave.current = null;
          setLeaveOpen(false);
          navigate(to);
        }}
      />

      {seoTitle && (
        <Modal open onClose={() => setSeoTitle(null)} size="md">
          <ModalHeader title="Generated SEO Title" subtitle="Suggested title tag for this page." onClose={() => setSeoTitle(null)} />
          <div className="px-6 py-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {seoTitle}
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(seoTitle).catch(() => undefined);
                  toast('SEO title copied.', 'success');
                }}
                className="btn-secondary btn-sm"
              >
                <Clipboard size={14} /> Copy
              </button>
              <button onClick={() => setSeoTitle(null)} className="btn-ghost btn-sm">
                <X size={14} /> Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}