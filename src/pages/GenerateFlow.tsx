import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardList,
  FileText,
  LayoutTemplate,
  Lightbulb,
  RefreshCw,
  Save,
  Sparkles,
  TreePine,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { AiAnalysis, PageBlueprint, PrototypeSnapshot, SitemapPage } from '../types';
import { analyzeClient, buildPrototype, createVersion, generateBlueprints, generateSitemap, nextVersionNumber } from '../lib/generator';
import { versionStatusFor } from '../lib/generator';
import { getAIProvider, type GenerationContext } from '../lib/ai';
import { summarizeDynamicAnswers } from '../lib/typeQuestions';
import { sourceFingerprint } from '../lib/staleness';
import GenerationScreen from '../components/prototype/GenerationScreen';
import SitemapTree from '../components/prototype/SitemapTree';
import FlowTopbar from '../components/prototype/FlowTopbar';
import { cn, uid } from '../lib/utils';
import { getTheme } from '../themes';

type Phase = 'loading' | 'analysis' | 'sitemap' | 'blueprints' | 'prototype';

const FLOW_STEPS: Array<{ id: Phase; label: string }> = [
  { id: 'analysis', label: 'AI Analysis' },
  { id: 'sitemap', label: 'Sitemap' },
  { id: 'blueprints', label: 'Page Blueprints' },
  { id: 'prototype', label: 'Prototype' },
];

function FlowStepper({ current }: { current: Phase }) {
  return (
    <ol className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none sm:gap-2">
      {FLOW_STEPS.map((s, i) => {
        const idx = FLOW_STEPS.findIndex((f) => f.id === current);
        const done = i < idx;
        const active = i === idx;
        return (
          <li key={s.id} className="flex shrink-0 items-center gap-1 sm:gap-2">
            <span
              className={cn(
                'flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold transition-all sm:px-3 sm:py-1.5',
                active && 'bg-brand-600 text-white shadow-sm shadow-brand-600/30',
                done && 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
              )}
            >
              <span
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold',
                  active && 'bg-white/20',
                  done && 'bg-brand-600 text-white',
                  !done && !active && 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                )}
              >
                {done ? <Check size={12} strokeWidth={3.5} /> : i + 1}
              </span>
              {s.label}
            </span>
            {i < FLOW_STEPS.length - 1 && (
              <span className={cn('h-px w-3 sm:w-5', done ? 'bg-brand-500' : 'bg-slate-200 dark:bg-slate-700')} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function FieldRow({ label, value, missing }: { label: string; value: string; missing?: boolean }) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 py-2.5 last:border-0 dark:border-slate-800">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      <span
        className={cn(
          'text-sm font-medium',
          missing ? 'italic text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-200'
        )}
      >
        {missing ? `“${value}”` : value}
      </span>
    </div>
  );
}

export default function GenerateFlow() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { clients, settings, updateClient, toast } = useApp();
  const client = clients.find((c) => c.id === id);

  const [phase, setPhase] = useState<Phase>('loading');
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(null);
  const [sitemap, setSitemap] = useState<SitemapPage[] | null>(null);
  const [blueprints, setBlueprints] = useState<PageBlueprint[] | null>(null);
  const [aiFallback, setAiFallback] = useState(false);

  if (!client) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="card max-w-lg px-6 py-16 text-center">
          <AlertTriangle size={40} className="mx-auto text-slate-300 dark:text-slate-600" />
          <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">Client not found</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            This client may have been deleted. Head back to your client list.
          </p>
          <Link to="/clients" className="btn-primary mt-6">
            <ArrowLeft size={16} /> Back to clients
          </Link>
        </div>
      </div>
    );
  }

  const business = client.businessName || client.company || client.name;

  const persist = (analysisToSave: AiAnalysis, sitemapToSave: SitemapPage[]): PageBlueprint[] => {
    const bp = generateBlueprints(client, sitemapToSave);
    const proto: PrototypeSnapshot = buildPrototype(
      client,
      sitemapToSave,
      bp,
      client.theme || settings.defaultTheme
    );
    proto.businessLabel = business;
    const versions = client.prototypeVersions ?? [];
    const version = {
      ...createVersion(proto, versionStatusFor(client.status)),
      number: nextVersionNumber(versions),
    };
    updateClient(client.id, {
      aiAnalysis: analysisToSave,
      sitemap: sitemapToSave,
      pageBlueprints: bp,
      prototype: proto,
      prototypeVersions: [...versions, version],
      /* Record which source information this prototype was built from, so edits
         made later can be detected as making the prototype out of date. */
      prototypeSourceHash: sourceFingerprint(client),
    });
    return bp;
  };

  /* Optional AI enhancement of the deterministic pipeline. Never blocks or
     breaks generation: any failure falls back to the local result unchanged. */
  const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T | null> =>
    Promise.race([
      promise,
      new Promise<null>((resolve) => window.setTimeout(() => resolve(null), ms)),
    ]).catch(() => null);

  const enhance = async (
    a: AiAnalysis,
    sm: SitemapPage[]
  ): Promise<{ analysis: AiAnalysis; sitemap: SitemapPage[]; fellBack: boolean }> => {
    if (settings.aiProvider !== 'custom') return { analysis: a, sitemap: sm, fellBack: false };
    const provider = getAIProvider(settings);
    const ctx: GenerationContext = {
      business,
      industry: client.industry,
      projectType: client.projectType,
      projectGoal: client.projectGoal,
      targetAudience: client.targetAudience,
      features: [...client.features, ...client.customFeatures],
      pages: sm.map((p) => p.label),
      theme: client.theme || settings.defaultTheme,
      dynamicSummary: summarizeDynamicAnswers(client.dynamicAnswers, client.projectType),
    };
    try {
      const [aiPages, aiImprovements] = await Promise.all([
        withTimeout(provider.suggestSitemapPages(ctx), 10000),
        withTimeout(provider.suggestImprovements(ctx), 10000),
      ]);
      const next: SitemapPage[] = [...sm];
      (aiPages ?? []).forEach((raw) => {
        const clean = raw.trim();
        if (clean && !next.some((p) => p.label.toLowerCase() === clean.toLowerCase())) {
          next.push({ id: uid(), label: clean });
        }
      });
      const suggestions = [...a.suggestions];
      (aiImprovements ?? []).forEach((raw) => {
        const clean = raw.trim();
        if (clean && !suggestions.some((s) => s.toLowerCase() === clean.toLowerCase())) {
          suggestions.push(clean);
        }
      });
      return {
        analysis: { ...a, suggestions },
        sitemap: next.slice(0, 12),
        fellBack: provider.fellBack,
      };
    } catch {
      return { analysis: a, sitemap: sm, fellBack: provider.fellBack };
    }
  };

  const handleGenerated = async () => {
    const a = analyzeClient(client);
    const sm = generateSitemap(client);
    const enhanced = await enhance(a, sm);
    setAnalysis(enhanced.analysis);
    setSitemap(enhanced.sitemap);
    setAiFallback(enhanced.fellBack);
    const bp = persist(enhanced.analysis, enhanced.sitemap);
    setBlueprints(bp);
    setPhase('analysis');
    toast('Prototype generated successfully.', 'success');
  };

  const handleSitemapSave = () => {
    if (!sitemap) return;
    const bp = persist(analysis ?? analyzeClient(client), sitemap);
    setBlueprints(bp);
    setPhase('blueprints');
    toast('Sitemap saved. Page blueprints updated.', 'success');
  };

  const handleBlueprintsContinue = () => {
    setPhase('prototype');
    window.scrollTo({ top: 0 });
  };

  const theme = client.theme ? getTheme(client.theme) : undefined;
  const missingCount = analysis?.missing.length ?? 0;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <FlowTopbar
        backTo={`/clients/${client.id}`}
        backLabel="Client profile"
        title={
          phase === 'loading' ? (
            'Generating Website Prototype'
          ) : (
            <span className="flex items-center gap-2">
              <Sparkles size={15} className="text-brand-500" /> Website Prototype Generator
            </span>
          )
        }
        subtitle={business}
        actions={phase !== 'loading' ? <FlowStepper current={phase} /> : undefined}
      />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        {phase === 'loading' && <GenerationScreen business={business} onDone={handleGenerated} />}

        {/* ---------------------------------------------------------- */}
        {/* AI ANALYSIS                                                */}
        {/* ---------------------------------------------------------- */}
        {phase === 'analysis' && analysis && (
          <div className="space-y-5 animate-fade-in">
            <div className="card overflow-hidden">
              <div className="border-b border-slate-100 bg-gradient-to-r from-brand-600 to-violet-600 px-6 py-6 dark:border-slate-800">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white/80">
                  <Sparkles size={13} /> AI Requirement Analysis
                </div>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">
                  Project specification for {analysis.business}
                </h1>
                <p className="mt-1 text-sm text-indigo-100">
                  Structured from the information already collected for this client — nothing is invented.
                </p>
              </div>
              <div className="p-6">
                {aiFallback && (
                  <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                    <Sparkles size={16} className="mt-0.5 shrink-0 text-slate-400" />
                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      <span className="font-bold text-slate-800 dark:text-slate-100">AI generation unavailable.</span>{' '}
                      We created the prototype using your project requirements and selected theme. Everything below
                      works fully offline — you can retry AI anytime with “Regenerate analysis”.
                    </p>
                  </div>
                )}
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{analysis.summary}</p>
                {missingCount > 0 && (
                  <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-500" />
                    <p className="text-sm text-amber-800 dark:text-amber-300">
                      <span className="font-bold">{missingCount} field{missingCount === 1 ? '' : 's'} not provided:</span>{' '}
                      {analysis.missing.join(', ')}. These are marked “Not provided” and can be added later.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="card p-6">
                <h2 className="mb-1 text-[15px] font-bold text-slate-900 dark:text-white">Collected requirements</h2>
                <p className="mb-3 text-xs text-slate-400">Directly from the client's answers in the wizard.</p>
                <div>
                  {analysis.fields.map((f) => (
                    <FieldRow key={f.label} label={f.label} value={f.value} missing={f.missing} />
                  ))}
                </div>
              </div>

              <div className="space-y-5">
                <div className="card p-6">
                  <h2 className="flex items-center gap-2 text-[15px] font-bold text-slate-900 dark:text-white">
                    <Lightbulb size={16} className="text-amber-500" /> Suggestions
                  </h2>
                  <ul className="mt-3 space-y-2.5">
                    {analysis.suggestions.map((s, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                        {s}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-400 dark:border-slate-800">
                    Suggestions are derived from the client's own answers — they never invent business facts.
                  </p>
                </div>

                <div className="card flex items-center gap-4 p-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                    <TreePine size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      Next: review the suggested sitemap
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {sitemap?.length ?? 0} pages generated from the client's requirements — you can add, rename or reorder them.
                    </p>
                  </div>
                  <button onClick={() => setPhase('sitemap')} className="btn-primary btn-sm shrink-0">
                    Edit sitemap <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------- */}
        {/* SITEMAP                                                     */}
        {/* ---------------------------------------------------------- */}
        {phase === 'sitemap' && sitemap && (
          <div className="space-y-5 animate-fade-in">
            <div className="card p-6">
              <div className="mb-1 flex items-center gap-2">
                <TreePine size={17} className="text-brand-600 dark:text-brand-400" />
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Sitemap</h1>
              </div>
              <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
                The suggested site structure, generated from the client's required pages
                {client.projectType === 'E-commerce' ? ' (e-commerce structure detected)' : ''}.
                Add, rename, reorder or delete pages — the page blueprints and prototype update automatically.
              </p>
              <SitemapTree pages={sitemap} onChange={setSitemap} />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button onClick={() => setPhase('analysis')} className="btn-secondary">
                <ArrowLeft size={16} /> Back to analysis
              </button>
              <button onClick={handleSitemapSave} className="btn-primary">
                <Save size={16} /> Save sitemap &amp; continue
              </button>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------- */}
        {/* BLUEPRINTS                                                  */}
        {/* ---------------------------------------------------------- */}
        {phase === 'blueprints' && blueprints && (
          <div className="space-y-5 animate-fade-in">
            <div className="card p-6">
              <div className="mb-1 flex items-center gap-2">
                <ClipboardList size={17} className="text-brand-600 dark:text-brand-400" />
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Page Blueprints</h1>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Every page gets a UI/UX blueprint: the sections it contains, their purpose, content direction, call to action
                and visual direction{theme ? ` — following the ${theme.name} design system.` : '.'}
                You can fine-tune everything in the prototype workspace.
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              {blueprints.map((bp) => (
                <div key={bp.pageId} className="card overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-900/60">
                    <span className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                      <FileText size={15} className="text-brand-500" /> {bp.pageName}
                    </span>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-500 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700">
                      {bp.sections.length} sections
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {bp.sections.map((s, i) => (
                      <div key={i} className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-brand-50 text-[10px] font-bold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                            {i + 1}
                          </span>
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{s.name}</span>
                          {s.cta && (
                            <span className="ml-auto rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                              CTA: {s.cta}
                            </span>
                          )}
                        </div>
                        <div className="mt-2 space-y-1.5 pl-7 text-[13px] leading-relaxed">
                          <p className="text-slate-500 dark:text-slate-400">
                            <span className="font-semibold text-slate-600 dark:text-slate-300">Purpose:</span> {s.purpose}
                          </p>
                          <p className="text-slate-500 dark:text-slate-400">
                            <span className="font-semibold text-slate-600 dark:text-slate-300">Content:</span> {s.contentDirection}
                          </p>
                          <p className="text-slate-500 dark:text-slate-400">
                            <span className="font-semibold text-slate-600 dark:text-slate-300">Visual:</span> {s.visualDirection}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button onClick={() => setPhase('sitemap')} className="btn-secondary">
                <ArrowLeft size={16} /> Back to sitemap
              </button>
              <button onClick={handleBlueprintsContinue} className="btn-primary">
                <Sparkles size={16} /> Continue to prototype <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------- */}
        {/* PROTOTYPE READY                                            */}
        {/* ---------------------------------------------------------- */}
        {phase === 'prototype' && (
          <div className="space-y-5 animate-fade-in">
            <div className="card overflow-hidden">
              <div className="border-b border-slate-100 bg-gradient-to-r from-brand-600 to-violet-600 px-6 py-6 dark:border-slate-800">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white/80">
                  <Check size={13} /> Prototype ready
                </div>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">
                  Your website prototype is ready to explore
                </h1>
                <p className="mt-1 text-sm text-indigo-100">
                  An editable, theme-aware prototype was generated from the sitemap and page blueprints.
                </p>
              </div>
              <div className="grid gap-4 p-6 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Pages</p>
                  <p className="mt-0.5 text-lg font-bold text-slate-900 dark:text-white">
                    {sitemap?.length ?? 0}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Theme</p>
                  <p className="mt-0.5 truncate text-lg font-bold text-slate-900 dark:text-white">
                    {theme?.name ?? 'Selected theme'}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Blueprint sections</p>
                  <p className="mt-0.5 text-lg font-bold text-slate-900 dark:text-white">
                    {blueprints?.reduce((acc, b) => acc + b.sections.length, 0) ?? 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button onClick={() => setPhase('blueprints')} className="btn-secondary">
                <ArrowLeft size={16} /> Back to blueprints
              </button>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => navigate(`/clients/${client.id}/generate`)}
                  className="btn-ghost"
                >
                  <RefreshCw size={15} /> Regenerate
                </button>
                <button onClick={() => navigate(`/clients/${client.id}/prototype`)} className="btn-primary">
                  <LayoutTemplate size={16} /> Open prototype workspace <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-center pb-6 pt-4">
          {phase === 'analysis' && (
            <button onClick={handleGenerated} className="btn-ghost btn-sm">
              <RefreshCw size={13} /> Regenerate analysis
            </button>
          )}
        </div>
      </main>
    </div>
  );
}