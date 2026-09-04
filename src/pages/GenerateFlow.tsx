import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardList,
  FileText,
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
import GenerationScreen from '../components/prototype/GenerationScreen';
import SitemapTree from '../components/prototype/SitemapTree';
import FlowTopbar from '../components/prototype/FlowTopbar';
import { cn } from '../lib/utils';
import { getTheme } from '../themes';

type Phase = 'loading' | 'analysis' | 'sitemap' | 'blueprints';

const FLOW_STEPS: Array<{ id: Phase | 'prototype'; label: string }> = [
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
      ...createVersion(proto, versionStatusFor(Boolean(client.approval?.approved))),
      number: nextVersionNumber(versions),
    };
    updateClient(client.id, {
      aiAnalysis: analysisToSave,
      sitemap: sitemapToSave,
      pageBlueprints: bp,
      prototype: proto,
      prototypeVersions: [...versions, version],
    });
    return bp;
  };

  const handleGenerated = () => {
    const a = analyzeClient(client);
    const sm = generateSitemap(client);
    setAnalysis(a);
    setSitemap(sm);
    const bp = persist(a, sm);
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
              <button onClick={() => navigate(`/clients/${client.id}/prototype`)} className="btn-primary">
                <Sparkles size={16} /> Open prototype workspace <ArrowRight size={16} />
              </button>
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