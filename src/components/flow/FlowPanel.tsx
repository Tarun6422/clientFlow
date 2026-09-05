import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Pencil,
  Send,
  Sparkles,
  Star,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { AiConversation, Client, FlowMessage } from '../../types';
import { FEATURES, PAGES } from '../../lib/constants';
import {
  answerStep,
  freshConversation,
  missingImportant,
  parseCommand,
  readiness,
  recommendationsFor,
  recommendTheme,
  reviewSuggestionsFor,
  applyReviewSuggestions,
  stepsFor,
  stepOptionsFor,
  summaryOf,
  type FlowCommand,
  type FlowStep,
  type StepAnswer,
} from '../../lib/interview';
import { getAIProvider, type AnswerInterpretation } from '../../lib/ai';
import { cn, uid } from '../../lib/utils';
import { THEMES } from '../../themes';
import FlowRobot, { type FlowRobotState } from './FlowRobot';

interface PendingConfirm {
  step: FlowStep;
  value: string | string[] | boolean;
  label: string;
  ack: string;
  patch?: Partial<Client>;
  dynamic?: Record<string, string | string[] | boolean>;
}

type DynamicPatch = Record<string, string | string[] | boolean>;

const GENERATION_STEPS = [
  'Understanding business',
  'Organizing requirements',
  'Creating sitemap',
  'Planning page sections',
  'Applying design system',
  'Building responsive prototype',
];

export default function FlowPanel({ clientId, onClose }: { clientId: string; onClose: () => void }) {
  const { clients, settings, updateClient, toast } = useApp();
  const navigate = useNavigate();
  const client = clients.find((c) => c.id === clientId);

  const [convo, setConvo] = useState<AiConversation | null>(() => client?.aiConversation ?? null);
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const [robotState, setRobotState] = useState<FlowRobotState>('idle');
  const [freeText, setFreeText] = useState('');
  const [textValue, setTextValue] = useState('');
  const [dateValue, setDateValue] = useState('');
  const [multiSel, setMultiSel] = useState<string[]>([]);
  const [otherMode, setOtherMode] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genIndex, setGenIndex] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const freeInputRef = useRef<HTMLInputElement>(null);

  const steps = useMemo(() => (client ? stepsFor(client) : []), [client]);
  const current = steps.find((s) => s.id === convo?.currentStep) ?? null;
  const currentIdx = current ? steps.findIndex((s) => s.id === current.id) : -1;

  /* ---------- persistence ---------- */

  const persist = (
    nextConvo: AiConversation,
    patch?: Partial<Client>,
    dynamic?: DynamicPatch
  ) => {
    if (!client) return;
    const dynamicAnswers = dynamic
      ? { ...(client.dynamicAnswers ?? {}), ...dynamic }
      : client.dynamicAnswers;
    updateClient(client.id, { ...(patch ?? {}), dynamicAnswers, aiConversation: nextConvo });
    setConvo(nextConvo);
  };

  /* ---------- message builders ---------- */

  const agentMsg = (content: string, extra?: Partial<FlowMessage>): FlowMessage => ({
    id: uid(),
    role: 'agent',
    content,
    timestamp: Date.now(),
    ...extra,
  });

  const questionMsg = (step: FlowStep, c: Client): FlowMessage =>
    agentMsg(typeof step.question === 'function' ? step.question(c) : step.question, {
      questionType: step.kind,
      field: step.field,
      options: stepOptionsFor(step, c),
    });

  /* ---------- lifecycle ---------- */

  useEffect(() => {
    if (!client) return;
    setConvo(client.aiConversation ?? freshConversation(client));
    setPending(null);
    setGenerating(false);
    setRobotState('idle');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [convo?.messages.length, pending, generating, genIndex]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Reset per-question controls when the active step changes.
  useEffect(() => {
    setOtherMode(false);
    setTextValue('');
    setDateValue('');
    if (client && current) {
      if (current.field === 'pages') setMultiSel([...client.pages]);
      else if (current.field === 'features') setMultiSel([...client.features]);
      else if (current.field?.startsWith('dynamic.')) {
        const id = current.field.slice('dynamic.'.length);
        const v = client.dynamicAnswers?.[id];
        setMultiSel(Array.isArray(v) ? [...v] : []);
      } else {
        setMultiSel([]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convo?.currentStep]);

  useEffect(() => {
    if (generating) {
      if (genIndex < GENERATION_STEPS.length) {
        const t = window.setTimeout(() => setGenIndex((i) => i + 1), 480);
        return () => window.clearTimeout(t);
      }
    }
  }, [generating, genIndex]);

  if (!client) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white dark:bg-slate-900">
        <p className="text-sm text-slate-500">This client no longer exists.</p>
        <button onClick={onClose} className="btn-secondary btn-sm absolute right-4 top-4">
          <X size={14} /> Close
        </button>
      </div>
    );
  }

  const business = client.businessName || client.company || client.name || 'this project';
  const recs = recommendationsFor(client);
  const themeRec = recommendTheme(client);
  const summaryRows = summaryOf(client);
  const readyPct = readiness(client);

  /* ---------- interview actions ---------- */

  const start = () => {
    if (!convo) return;
    const first = steps[0];
    if (!first) return;
    persist({
      ...convo,
      started: true,
      currentStep: first.id,
      history: [first.id],
      messages: [...convo.messages, questionMsg(first, client)],
      updatedAt: Date.now(),
    });
    setRobotState('asking');
  };

  const commitAnswer = (base: AiConversation, res: StepAnswer, step: FlowStep) => {
    const merged: Client = {
      ...client,
      ...(res.patch ?? {}),
      dynamicAnswers: res.dynamic
        ? { ...(client.dynamicAnswers ?? {}), ...res.dynamic }
        : client.dynamicAnswers,
    };
    const nextSteps = stepsFor(merged);
    const idx = nextSteps.findIndex((s) => s.id === step.id);
    const next = idx >= 0 ? nextSteps[idx + 1] : null;
    const msgs = [...base.messages];
    const last = msgs[msgs.length - 1];
    if (last && last.role === 'user' && last.value === undefined) {
      msgs[msgs.length - 1] = { ...last, value: res.value, field: step.field };
    }
    msgs.push(agentMsg(res.ack));
    let nextConvo: AiConversation;
    if (next) {
      nextConvo = {
        ...base,
        currentStep: next.id,
        history: [...base.history, next.id],
        messages: [...msgs, questionMsg(next, merged)],
        updatedAt: Date.now(),
      };
    } else {
      nextConvo = {
        ...base,
        finished: true,
        messages: [
          ...msgs,
          agentMsg("That's everything I need — the brief is saved and ready whenever you are."),
        ],
        updatedAt: Date.now(),
      };
    }
    persist(nextConvo, res.patch, res.dynamic);
    setRobotState(next ? 'asking' : 'success');
  };

  const refineWithAi = async (base: AiConversation, step: FlowStep, raw: string, chosen: string | string[] | undefined) => {
    let res = answerStep(client, step, raw, chosen);
    if (settings.aiProvider === 'custom' && !chosen && step.field && raw.trim()) {
      const provider = getAIProvider(settings);
      const ai = await provider.interpretAnswer(
        typeof step.question === 'function' ? step.question(client) : step.question,
        raw,
        { field: step.field, options: stepOptionsFor(step, client) }
      );
      if (provider.fellBack && !base.fellBack) {
        const nextConvo = {
          ...base,
          fellBack: true,
          messages: [
            ...base.messages,
            {
              id: uid(),
              role: 'system' as const,
              content:
                'AI assistance is currently unavailable. I\'ll continue using ClientFlow\'s guided discovery flow.',
              timestamp: Date.now(),
            },
          ],
          updatedAt: Date.now(),
        };
        persist(nextConvo);
        setRobotState('warning');
        window.setTimeout(() => setRobotState('asking'), 1200);
      }
      if (ai) res = applyAiRefinement(res, step, ai);
    }
    if (res.stay) {
      const nextConvo = {
        ...base,
        messages: [...base.messages, agentMsg(res.ack)],
        updatedAt: Date.now(),
      };
      persist(nextConvo);
      setRobotState('asking');
      return;
    }
    if (res.needsConfirm) {
      setPending({
        step,
        value: res.value,
        label: res.label,
        ack: res.ack,
        patch: res.patch,
        dynamic: res.dynamic,
      });
      const nextConvo = {
        ...base,
        messages: [
          ...base.messages,
          agentMsg(res.confirmQuestion ?? `Should I record ${res.label}?`),
        ],
        updatedAt: Date.now(),
      };
      persist(nextConvo);
      setRobotState('thinking');
      return;
    }
    commitAnswer(base, res, step);
  };

  const applyAiRefinement = (res: StepAnswer, step: FlowStep, ai: AnswerInterpretation): StepAnswer => {
    if (step.field?.startsWith('dynamic.')) {
      const dynId = step.field.slice('dynamic.'.length);
      if (typeof ai.value === 'boolean' && step.kind === 'yesno') {
        return {
          ...res,
          value: ai.value,
          label: ai.value ? 'Yes' : 'No',
          dynamic: { [dynId]: ai.value },
        };
      }
      if (typeof ai.value === 'string' && (step.kind === 'number' || step.kind === 'text')) {
        return { ...res, value: ai.value, label: ai.value, dynamic: { [dynId]: ai.value } };
      }
      return res;
    }
    if (typeof ai.value === 'string' && step.field && step.kind !== 'text' && step.kind !== 'date') {
      const opts = stepOptionsFor(step, client);
      if (opts.length === 0 || opts.includes(ai.value)) {
        return { ...res, value: ai.value, label: ai.value, patch: { ...res.patch, [step.field]: ai.value } };
      }
    }
    return res;
  };

  /** Answer to the active question (chips + per-question input). */
  const submitAnswer = (raw: string, chosen?: string | string[]) => {
    if (!convo || !current) return;
    const content =
      raw.trim() || (Array.isArray(chosen) ? chosen.join(', ') : chosen ?? '');
    if (!content) return;
    const base = {
      ...convo,
      messages: [...convo.messages, userMsg(content)],
      updatedAt: Date.now(),
    };
    setConvo(base);
    setRobotState('listening');
    void refineWithAi(base, current, content, chosen);
  };

  /** Free-form input — commands first, otherwise a natural answer. */
  const submitFree = (raw: string) => {
    const content = raw.trim();
    if (!content || !convo || !current) return;
    const cmd = parseCommand(content);
    if (cmd) {
      const base = {
        ...convo,
        messages: [...convo.messages, userMsg(content)],
        updatedAt: Date.now(),
      };
      setConvo(base);
      handleCommand(cmd, base);
      return;
    }
    // Free text on non-question steps shouldn't advance the interview.
    if (
      current.kind === 'summary' ||
      current.kind === 'missing' ||
      current.kind === 'suggest' ||
      current.kind === 'review'
    ) {
      const patch: Partial<Client> =
        current.kind === 'summary' && content
          ? { notes: [client.notes, content].filter(Boolean).join('\n') }
          : {};
      const nextConvo = {
        ...convo,
        messages: [
          ...convo.messages,
          userMsg(content),
          agentMsg(
            current.kind === 'summary'
              ? "Got it — I've added that to the brief notes."
              : 'Got it — use the buttons below to continue.'
          ),
        ],
        updatedAt: Date.now(),
      };
      persist(nextConvo, patch);
      setRobotState('asking');
      return;
    }
    submitAnswer(content);
  };

  const userMsg = (content: string): FlowMessage => ({
    id: uid(),
    role: 'user',
    content,
    timestamp: Date.now(),
  });

  /* ---------- commands ---------- */

  const handleCommand = (cmd: FlowCommand, base: AiConversation) => {
    switch (cmd?.type) {
      case 'skip':
        doSkip(base);
        break;
      case 'back':
        doBack(base);
        break;
      case 'restart': {
        const fresh = freshConversation(client);
        fresh.messages = [
          ...fresh.messages,
          agentMsg(
            "Okay — let's start the interview over. Your saved answers stay on the client; you'll just re-confirm the important ones."
          ),
        ];
        persist(fresh);
        setPending(null);
        setRobotState('idle');
        break;
      }
      case 'generate':
        goGenerate(base);
        break;
      case 'themes':
        jumpTo('theme', base);
        break;
      case 'missing':
        jumpTo('missing', base);
        break;
      case 'answers':
        jumpTo('summary', base);
        break;
      case 'premium': {
        const nextConvo = {
          ...base,
          messages: [
            ...base.messages,
            agentMsg(
              "Got it — I'll keep a premium direction in mind. For a more premium feel, Dark Premium or Modern Minimal usually work best; you can switch any time in the theme step."
            ),
          ],
          updatedAt: Date.now(),
        };
        persist(nextConvo);
        setRobotState('suggesting');
        break;
      }
      case 'improve': {
        const nextConvo = {
          ...base,
          messages: [
            ...base.messages,
            agentMsg(
              client.prototype
                ? "Let's take a look — here are my suggestions for the prototype."
                : "I can help improve the brief — once a prototype exists I'll review it with specific suggestions."
            ),
          ],
          updatedAt: Date.now(),
        };
        persist(nextConvo);
        if (client.prototype) jumpTo('review', nextConvo);
        break;
      }
      case 'add':
      case 'remove':
        requirementChange(base, cmd.type, cmd.arg);
        break;
      default:
        break;
    }
  };

  const doSkip = (base: AiConversation) => {
    if (!current) return;
    const step = current;
    const idx = steps.findIndex((s) => s.id === step.id);
    const next = idx >= 0 ? steps[idx + 1] : null;
    const nextConvo: AiConversation = {
      ...base,
      currentStep: next ? next.id : step.id,
      history: next ? [...base.history, next.id] : base.history,
      skipped: [...base.skipped, step.id],
      messages: [
        ...base.messages,
        agentMsg(`No problem — I've noted “${shortStepName(step)}” as not provided for now.`),
        ...(next ? [questionMsg(next, client)] : []),
      ],
      updatedAt: Date.now(),
    };
    persist(nextConvo);
    setRobotState('asking');
  };

  const doBack = (base: AiConversation) => {
    const history = [...base.history];
    history.pop();
    let prev: string | null = null;
    while (history.length > 0) {
      const id = history.pop() as string;
      if (steps.some((s) => s.id === id)) {
        prev = id;
        break;
      }
    }
    if (!prev) return;
    const step = steps.find((s) => s.id === prev);
    if (!step) return;
    setPending(null);
    const nextConvo: AiConversation = {
      ...base,
      currentStep: prev,
      history: [...history, prev],
      messages: [...base.messages, agentMsg("Sure — let's revisit that."), questionMsg(step, client)],
      updatedAt: Date.now(),
    };
    persist(nextConvo);
    setRobotState('asking');
  };

  const jumpTo = (stepId: string, base?: AiConversation) => {
    const b = base ?? convo;
    if (!b) return;
    const step = steps.find((s) => s.id === stepId);
    if (!step) return;
    const nextConvo: AiConversation = {
      ...b,
      currentStep: stepId,
      history: [...b.history, stepId],
      messages: [...b.messages, questionMsg(step, client)],
      updatedAt: Date.now(),
    };
    persist(nextConvo);
    setPending(null);
    setRobotState(step.kind === 'theme' || step.kind === 'suggest' ? 'suggesting' : 'asking');
  };

  const advanceFrom = (step: FlowStep, base?: AiConversation) => {
    const b = base ?? convo;
    if (!b) return;
    const nextSteps = stepsFor(client);
    const idx = nextSteps.findIndex((s) => s.id === step.id);
    const next = idx >= 0 ? nextSteps[idx + 1] : null;
    if (!next) return;
    const nextConvo: AiConversation = {
      ...b,
      currentStep: next.id,
      history: [...b.history, next.id],
      messages: [...b.messages, questionMsg(next, client)],
      updatedAt: Date.now(),
    };
    persist(nextConvo);
    setRobotState(next.kind === 'theme' || next.kind === 'suggest' ? 'suggesting' : 'asking');
  };

  const requirementChange = (base: AiConversation, kind: 'add' | 'remove', arg: string) => {
    const norm = arg.toLowerCase().replace(/^(the |a |an )/, '');
    const matchIn = (list: string[]) =>
      list.find(
        (x) =>
          x.toLowerCase() === norm ||
          x.toLowerCase().includes(norm) ||
          norm.includes(x.toLowerCase())
      );
    const feat = matchIn(FEATURES);
    const page = matchIn(PAGES);
    let patch: Partial<Client> = {};
    let ack = '';
    if (kind === 'add') {
      if (feat && !client.features.some((f) => f.toLowerCase() === feat.toLowerCase())) {
        patch.features = [...client.features, feat];
        ack = `Added “${feat}” to the requirements.`;
      } else if (page && !client.pages.some((p) => p.toLowerCase() === page.toLowerCase())) {
        patch.pages = [...client.pages, page];
        ack = `Added “${page}” to the pages.`;
      } else if (!feat && !page) {
        patch.customFeatures = [...client.customFeatures, arg.trim()];
        ack = `Added “${arg.trim()}” as a custom feature.`;
      } else {
        ack = `“${arg}” is already in the requirements.`;
      }
    } else {
      const findIdx = (list: string[]) =>
        list.findIndex(
          (x) =>
            x.toLowerCase() === norm ||
            x.toLowerCase().includes(norm) ||
            norm.includes(x.toLowerCase())
        );
      const fIdx = findIdx(client.features);
      if (fIdx >= 0) {
        patch.features = client.features.filter((_, i) => i !== fIdx);
        ack = `Removed “${client.features[fIdx]}” from the features.`;
      } else {
        const pIdx = findIdx(client.pages);
        if (pIdx >= 0) {
          patch.pages = client.pages.filter((_, i) => i !== pIdx);
          ack = `Removed “${client.pages[pIdx]}” from the pages.`;
        } else {
          const cfIdx = findIdx(client.customFeatures);
          if (cfIdx >= 0) {
            patch.customFeatures = client.customFeatures.filter((_, i) => i !== cfIdx);
            ack = `Removed “${client.customFeatures[cfIdx]}”.`;
          } else {
            const cpIdx = findIdx(client.customPages);
            if (cpIdx >= 0) {
              patch.customPages = client.customPages.filter((_, i) => i !== cpIdx);
              ack = `Removed “${client.customPages[cpIdx]}”.`;
            } else {
              ack = `I couldn't find “${arg}” in the requirements.`;
            }
          }
        }
      }
    }
    const nextConvo = {
      ...base,
      messages: [...base.messages, agentMsg(ack)],
      updatedAt: Date.now(),
    };
    persist(nextConvo, patch);
    setRobotState('asking');
  };

  /* ---------- generation handoff ---------- */

  const goGenerate = (base?: AiConversation) => {
    const b = base ?? convo;
    setGenerating(true);
    setRobotState('generating');
    setGenIndex(0);
    if (b) {
      const nextConvo = {
        ...b,
        finished: true,
        messages: [
          ...b.messages,
          agentMsg('Perfect. I have enough information.'),
          agentMsg("I'm turning this into a website concept now."),
        ],
        updatedAt: Date.now(),
      };
      persist(nextConvo);
    }
  };

  const openPrototype = () => {
    navigate(`/clients/${client.id}/generate`);
  };

  /* ---------- pending confirm ---------- */

  const confirmPending = (yes: boolean) => {
    if (!pending || !convo) return;
    if (yes) {
      commitAnswer(convo, pending, pending.step);
    } else {
      const nextConvo = {
        ...convo,
        messages: [
          ...convo.messages,
          agentMsg("No problem — let's try that again."),
          questionMsg(pending.step, client),
        ],
        updatedAt: Date.now(),
      };
      persist(nextConvo);
    }
    setPending(null);
  };

  /* ---------- review apply ---------- */

  const applyReview = () => {
    const { client: next, applied } = applyReviewSuggestions(client);
    if (applied.length === 0) {
      toast('Nothing to apply — the prototype is already up to date.', 'info');
      return;
    }
    updateClient(client.id, {
      prototype: next.prototype,
      prototypeVersions: next.prototypeVersions,
    });
    if (convo) {
      const nextConvo = {
        ...convo,
        messages: [
          ...convo.messages,
          agentMsg(`Done — I applied: ${applied.join('; ')}. A new version was saved.`),
        ],
        updatedAt: Date.now(),
      };
      updateClient(client.id, {
        prototype: next.prototype,
        prototypeVersions: next.prototypeVersions,
        aiConversation: nextConvo,
      });
      setConvo(nextConvo);
    }
    setRobotState('success');
    toast('Review suggestions applied — a new prototype version was saved.');
  };

  /* ---------- render ---------- */

  const controls = current ? (
    <StepControls
      step={current}
      options={stepOptionsFor(current, client)}
      multiSel={multiSel}
      onToggleMulti={(v) =>
        setMultiSel((prev) =>
          prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
        )
      }
      textValue={textValue}
      onText={(v) => setTextValue(v)}
      dateValue={dateValue}
      onDate={(v) => setDateValue(v)}
      otherMode={otherMode}
      onSubmit={(raw, chosen) => submitAnswer(raw, chosen)}
      onDoneMulti={() => submitAnswer('', multiSel)}
      onSkip={() => {
        const base = convo as AiConversation;
        setConvo({ ...base, messages: [...base.messages, userMsg('Skip')], updatedAt: Date.now() });
        doSkip({ ...base, messages: [...base.messages, userMsg('Skip')], updatedAt: Date.now() });
      }}
      onOther={() => setOtherMode(true)}
      onAdvance={() => advanceFrom(current)}
      recs={recs}
      onAddRec={(kind, item) => {
        const base = convo as AiConversation;
        const msg = userMsg(kind === 'pages' ? `Add ${item}` : `Add ${item}`);
        const next = { ...base, messages: [...base.messages, msg], updatedAt: Date.now() };
        setConvo(next);
        requirementChange(next, 'add', item);
      }}
      onAddAllRec={() => {
        const base = convo as AiConversation;
        const items = [...recs.pages, ...recs.features];
        if (items.length === 0) return;
        const msg = userMsg(`Add all: ${items.join(', ')}`);
        const next = { ...base, messages: [...base.messages, msg], updatedAt: Date.now() };
        setConvo(next);
        const patch: Partial<Client> = {
          pages: [...new Set([...client.pages, ...recs.pages])],
          features: [...new Set([...client.features, ...recs.features])],
        };
        const nextConvo = {
          ...next,
          messages: [
            ...next.messages,
            agentMsg(`Done — I added ${items.length} recommendation${items.length === 1 ? '' : 's'} to the brief.`),
          ],
          updatedAt: Date.now(),
        };
        persist(nextConvo, patch);
      }}
      themeRec={themeRec}
      currentThemeId={client.theme}
      summaryRows={summaryRows}
      readyPct={readyPct}
      missing={missingImportant(client)}
      suggestions={reviewSuggestionsFor(client)}
      onGenerate={() => goGenerate()}
      onReviewAnswers={() => jumpTo(steps[0]?.id ?? 'businessName')}
      onAddInfo={() => freeInputRef.current?.focus()}
      onApplyReview={applyReview}
      onReviewManually={() => navigate(`/clients/${client.id}/prototype`)}
      onPickTheme={(id) => submitAnswer(id)}
    />
  ) : null;

  return (
    <div
      className="flow-panel fixed inset-0 z-[60] flex flex-col bg-white dark:bg-slate-900 sm:inset-auto sm:bottom-4 sm:right-4 sm:top-4 sm:w-[400px] sm:rounded-2xl sm:border sm:border-slate-200 sm:shadow-2xl sm:dark:border-slate-800"
      role="dialog"
      aria-label="Flow — website copilot"
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <FlowRobot state={robotState} size={34} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-white">
            Flow
            <span className="rounded-full bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              Website Copilot
            </span>
          </p>
          <p className="truncate text-xs text-slate-400">{business}</p>
        </div>
        <button onClick={onClose} className="icon-btn" aria-label="Close Flow">
          <X size={17} />
        </button>
      </div>

      {/* Progress */}
      <div className="px-4 pt-3">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
          <span className="uppercase tracking-wide">Website Discovery</span>
          {convo?.started && currentIdx >= 0 ? (
            <span>
              Step {currentIdx + 1} of {steps.length}
            </span>
          ) : (
            <span>Getting to know the project</span>
          )}
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-violet-500 transition-all duration-500"
            style={{
              width: `${
                convo?.started && steps.length > 0
                  ? ((currentIdx + 1) / steps.length) * 100
                  : 0
              }%`,
            }}
          />
        </div>
      </div>

      {/* Live project summary */}
      <div className="px-4 pt-2.5">
        <button
          onClick={() => setSummaryOpen((o) => !o)}
          className="flex w-full items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2 text-left dark:border-slate-800 dark:bg-slate-900/70"
          aria-expanded={summaryOpen}
        >
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
            Project so far · {readyPct}% ready
          </span>
          {summaryOpen ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
        </button>
        {summaryOpen && (
          <div className="mt-1.5 space-y-1 rounded-xl border border-slate-100 bg-slate-50/40 p-3 dark:border-slate-800 dark:bg-slate-900/40">
            {summaryRows.slice(0, 7).map((row) => (
              <div key={row.label} className="flex items-start justify-between gap-3 text-[12px]">
                <span className="shrink-0 font-semibold uppercase tracking-wide text-slate-400">
                  {row.label}
                </span>
                <span className="min-w-0 truncate text-right font-medium text-slate-700 dark:text-slate-200">
                  {row.value}
                </span>
              </div>
            ))}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Progress</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${readyPct}%` }}
                />
              </div>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">{readyPct}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3" aria-live="polite">
        {convo?.messages.map((m) =>
          m.role === 'system' ? (
            <p key={m.id} className="mx-auto max-w-[95%] text-center text-[11px] italic text-slate-400">
              {m.content}
            </p>
          ) : m.role === 'user' ? (
            <div key={m.id} className="flex justify-end">
              <p className="max-w-[85%] rounded-2xl rounded-tr-sm bg-brand-600 px-3.5 py-2.5 text-[13px] leading-relaxed text-white shadow-sm">
                {m.content}
              </p>
            </div>
          ) : (
            <div key={m.id} className="flex items-start gap-2.5">
              <FlowRobot size={26} state={robotState} />
              <p className="max-w-[85%] rounded-2xl rounded-tl-sm bg-slate-100 px-3.5 py-2.5 text-[13px] leading-relaxed text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {m.content}
              </p>
            </div>
          )
        )}
        {pending && (
          <div className="flex items-start gap-2.5">
            <FlowRobot size={26} state="thinking" />
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Confirm
              </p>
              <div className="flex gap-2">
                <button onClick={() => confirmPending(true)} className="chip chip-active">
                  <Check size={13} /> Yes
                </button>
                <button onClick={() => confirmPending(false)} className="chip">
                  Change
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Question controls / generating view */}
      {generating ? (
        <div className="border-t border-slate-100 px-4 py-5 dark:border-slate-800">
          <div className="flex flex-col items-center text-center">
            <FlowRobot size={64} state={genIndex >= GENERATION_STEPS.length ? 'success' : 'generating'} />
            <p className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
              {genIndex >= GENERATION_STEPS.length ? 'Your prototype is ready 🎉' : 'Building your website concept…'}
            </p>
            <ul className="mt-3 w-full space-y-1.5 text-left">
              {GENERATION_STEPS.map((s, i) => (
                <li
                  key={s}
                  className={cn(
                    'flex items-center gap-2 text-[12px] font-medium',
                    i < genIndex
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : i === genIndex
                        ? 'text-brand-600 dark:text-brand-400'
                        : 'text-slate-300 dark:text-slate-600'
                  )}
                >
                  {i < genIndex ? (
                    <Check size={13} strokeWidth={3} />
                  ) : i === genIndex ? (
                    <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-brand-500" />
                  ) : (
                    <span className="h-2.5 w-2.5 rounded-full border border-slate-300 dark:border-slate-600" />
                  )}
                  {s}
                </li>
              ))}
            </ul>
            {genIndex >= GENERATION_STEPS.length && (
              <button onClick={openPrototype} className="btn-primary mt-4 w-full">
                <Sparkles size={15} /> Open Prototype <ArrowRight size={15} />
              </button>
            )}
          </div>
        </div>
      ) : !convo?.started ? (
        <div className="border-t border-slate-100 px-4 py-4 dark:border-slate-800">
          <button onClick={start} className="btn-primary w-full">
            Let's Start <ArrowRight size={16} />
          </button>
        </div>
      ) : current ? (
        controls
      ) : (
        <div className="border-t border-slate-100 px-4 py-4 dark:border-slate-800">
          <p className="mb-2 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
            The client's information changed outside the interview, so I need to re-check a few things.
          </p>
          <button
            onClick={() => jumpTo(steps[0]?.id ?? 'businessName')}
            className="btn-primary w-full"
          >
            Continue interview <ArrowRight size={15} />
          </button>
        </div>
      )}

      {/* Free chat input */}
      {!generating && convo?.started && (
        <div className="border-t border-slate-100 px-4 py-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex flex-col gap-1">
              <button
                onClick={() => {
                  const base = convo as AiConversation;
                  const msg = userMsg('Go back');
                  const next = { ...base, messages: [...base.messages, msg], updatedAt: Date.now() };
                  setConvo(next);
                  doBack(next);
                }}
                className="icon-btn !h-8 !w-8"
                aria-label="Go back to previous question"
                title="Go back"
              >
                <ArrowLeft size={14} />
              </button>
              <button
                onClick={() => {
                  const base = convo as AiConversation;
                  const msg = userMsg('Skip');
                  const next = { ...base, messages: [...base.messages, msg], updatedAt: Date.now() };
                  setConvo(next);
                  doSkip(next);
                }}
                className="icon-btn !h-8 !w-8"
                aria-label="Skip this question"
                title="Skip"
              >
                <X size={14} />
              </button>
            </div>
            <div className="relative flex-1">
              <input
                ref={freeInputRef}
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    submitFreeText();
                  }
                }}
                placeholder="Tell Flow what you need…"
                aria-label="Message Flow"
                className="input !py-2.5 pr-9"
              />
              <button
                onClick={submitFreeText}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10"
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
          <p className="mt-1.5 text-center text-[10px] text-slate-400">
            Try: “skip” · “go back” · “add WhatsApp” · “remove blog” · “generate prototype”
          </p>
        </div>
      )}
    </div>
  );

  function submitFreeText() {
    const raw = freeText.trim();
    if (!raw || !convo || !current) return;
    setFreeText('');
    submitFree(raw);
  }
}

/* ------------------------------------------------------------------ */
/* Step controls                                                       */
/* ------------------------------------------------------------------ */

function shortStepName(step: FlowStep): string {
  const map: Record<string, string> = {
    businessName: 'business name',
    industry: 'industry',
    description: 'business description',
    projectType: 'website type',
    projectGoal: 'project goal',
    targetAudience: 'target audience',
    deadline: 'project deadline',
    budget: 'budget',
    pages: 'required pages',
    features: 'required features',
    contentProvider: 'content provider',
    notes: 'additional notes',
    theme: 'design theme',
    themeVisuals: 'photography',
    suggestions: 'recommendations',
    missing: 'missing information',
    summary: 'summary',
    review: 'prototype review',
  };
  return map[step.id] ?? step.id.replace('dyn:', '');
}

function StepControls({
  step,
  options,
  multiSel,
  onToggleMulti,
  textValue,
  onText,
  dateValue,
  onDate,
  otherMode,
  onSubmit,
  onDoneMulti,
  onSkip,
  onOther,
  onAdvance,
  recs,
  onAddRec,
  onAddAllRec,
  themeRec,
  currentThemeId,
  summaryRows,
  readyPct,
  missing,
  suggestions,
  onGenerate,
  onReviewAnswers,
  onAddInfo,
  onApplyReview,
  onReviewManually,
  onPickTheme,
}: {
  step: FlowStep;
  options: string[];
  multiSel: string[];
  onToggleMulti: (v: string) => void;
  textValue: string;
  onText: (v: string) => void;
  dateValue: string;
  onDate: (v: string) => void;
  otherMode: boolean;
  onSubmit: (raw: string, chosen?: string | string[]) => void;
  onDoneMulti: () => void;
  onSkip: () => void;
  onOther: () => void;
  onAdvance: () => void;
  recs: { pages: string[]; features: string[] };
  onAddRec: (kind: 'pages' | 'features', item: string) => void;
  onAddAllRec: () => void;
  themeRec: { id: string; name: string; reason: string };
  currentThemeId: string;
  summaryRows: Array<{ label: string; value: string }>;
  readyPct: number;
  missing: Array<{ field: string; label: string }>;
  suggestions: Array<{ id: string; text: string }>;
  onGenerate: () => void;
  onReviewAnswers: () => void;
  onAddInfo: () => void;
  onApplyReview: () => void;
  onReviewManually: () => void;
  onPickTheme: (id: string) => void;
}) {
  if (step.kind === 'suggest') {
    const total = recs.pages.length + recs.features.length;
    return (
      <div className="space-y-3">
        <p className="flex items-center gap-1.5 text-[13px] font-bold text-slate-900 dark:text-white">
          <Lightbulb size={14} className="text-amber-500" /> Flow recommends
        </p>
        {total === 0 ? (
          <p className="text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
            Your requirements already cover everything I'd suggest for this project type.
          </p>
        ) : (
          <>
            {recs.pages.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Pages</p>
                <div className="mt-1.5 space-y-1.5">
                  {recs.pages.map((p) => (
                    <div key={p} className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-2.5 py-1.5 dark:border-slate-800">
                      <span className="text-[13px] font-medium text-slate-700 dark:text-slate-200">{p}</span>
                      <button onClick={() => onAddRec('pages', p)} className="btn-secondary btn-sm !py-1">
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {recs.features.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Features</p>
                <div className="mt-1.5 space-y-1.5">
                  {recs.features.map((f) => (
                    <div key={f} className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-2.5 py-1.5 dark:border-slate-800">
                      <span className="flex items-center gap-1.5 text-[13px] font-medium text-slate-700 dark:text-slate-200">
                        <Check size={13} className="text-emerald-500" /> {f}
                      </span>
                      <button onClick={() => onAddRec('features', f)} className="btn-secondary btn-sm !py-1">
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button onClick={onAddAllRec} className="btn-primary w-full">
              Add All ({total})
            </button>
          </>
        )}
        <button onClick={onAdvance} className="btn-ghost w-full text-xs">
          Done — continue <ArrowRight size={13} />
        </button>
      </div>
    );
  }

  if (step.kind === 'theme') {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-3 dark:border-brand-500/30 dark:bg-brand-500/10">
          <p className="flex items-center gap-1.5 text-xs font-bold text-brand-700 dark:text-brand-300">
            <Star size={12} className="fill-amber-400 text-amber-400" /> Flow recommends {themeRec.name}
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-slate-600 dark:text-slate-300">{themeRec.reason}</p>
          <button onClick={() => onPickTheme(themeRec.id)} className="btn-primary btn-sm mt-2 w-full">
            Use Recommended Theme
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {THEMES.map((t) => {
            const active = t.id === currentThemeId;
            const recommended = t.id === themeRec.id;
            return (
              <button
                key={t.id}
                onClick={() => onPickTheme(t.id)}
                className={cn(
                  'rounded-xl border p-2.5 text-left transition-all',
                  active
                    ? 'border-brand-500 ring-2 ring-brand-500/40'
                    : 'border-slate-200 hover:border-brand-300 dark:border-slate-700'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-slate-800 dark:text-slate-100">{t.name}</span>
                  {recommended && <Star size={11} className="fill-amber-400 text-amber-400" />}
                </div>
                <div className="mt-1.5 flex gap-1">
                  {[t.palette.primary, t.palette.secondary, t.palette.accent].map((c, i) => (
                    <span key={i} className="h-2.5 w-2.5 rounded-full border border-slate-200 dark:border-slate-700" style={{ backgroundColor: c }} />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
        <p className="text-center text-[10px] text-slate-400">You're in control — pick any theme.</p>
      </div>
    );
  }

  if (step.kind === 'missing') {
    return (
      <div className="space-y-3">
        {missing.length === 0 ? (
          <p className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
            You're all set — nothing critical is missing from the brief. 🎉
          </p>
        ) : (
          <>
            <p className="text-[13px] text-slate-600 dark:text-slate-300">
              I still need {missing.length} important detail{missing.length === 1 ? '' : 's'}:
            </p>
            <ul className="space-y-1.5">
              {missing.map((m) => (
                <li key={m.field} className="flex items-center gap-2 text-[13px] font-medium text-slate-700 dark:text-slate-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> {m.label}
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-slate-400">You can say “skip” to leave any of them as “Not provided”.</p>
          </>
        )}
        <button onClick={onAdvance} className="btn-primary w-full">
          {missing.length === 0 ? 'Continue' : 'Continue anyway'} <ArrowRight size={15} />
        </button>
      </div>
    );
  }

  if (step.kind === 'summary') {
    return (
      <div className="space-y-3">
        <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-900/40">
          {summaryRows.map((row) => (
            <div key={row.label} className="flex items-start justify-between gap-3 text-[12px]">
              <span className="shrink-0 font-semibold uppercase tracking-wide text-slate-400">{row.label}</span>
              <span className="min-w-0 text-right font-medium text-slate-700 dark:text-slate-200">{row.value}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 border-t border-slate-100 pt-1.5 dark:border-slate-800">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Readiness</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${readyPct}%` }} />
            </div>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">{readyPct}%</span>
          </div>
        </div>
        <button onClick={onGenerate} className="btn-primary w-full">
          <Sparkles size={15} /> Generate Prototype
        </button>
        <div className="flex gap-2">
          <button onClick={onReviewAnswers} className="btn-secondary btn-sm flex-1">
            <Pencil size={12} /> Review Answers
          </button>
          <button onClick={onAddInfo} className="btn-ghost btn-sm flex-1">
            Add More Information
          </button>
        </div>
      </div>
    );
  }

  if (step.kind === 'review') {
    return (
      <div className="space-y-3">
        {suggestions.length === 0 ? (
          <p className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
            The prototype looks solid — I don't see anything critical to change. You can still review it manually.
          </p>
        ) : (
          <>
            <p className="text-[13px] font-bold text-slate-900 dark:text-white">I have {suggestions.length} suggestion{suggestions.length === 1 ? '' : 's'}:</p>
            <ul className="space-y-1.5">
              {suggestions.map((s) => (
                <li key={s.id} className="flex items-start gap-2 text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
                  <Lightbulb size={13} className="mt-0.5 shrink-0 text-amber-500" /> {s.text}
                </li>
              ))}
            </ul>
            <button onClick={onApplyReview} className="btn-primary w-full">
              <Check size={15} /> Apply Suggestions
            </button>
          </>
        )}
        <button onClick={onReviewManually} className="btn-secondary w-full">
          Review Manually <ArrowRight size={15} />
        </button>
      </div>
    );
  }

  /* ---------------- basic question controls ---------------- */

  if (step.kind === 'yesno') {
    return (
      <div className="space-y-2.5">
        <div className="flex flex-wrap gap-2">
          {['Yes', 'No', 'Not Sure'].map((o) => (
            <button key={o} onClick={() => onSubmit(o)} className="chip">
              {o}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step.kind === 'choice') {
    if (otherMode) {
      return (
        <div className="space-y-2">
          <input
            value={textValue}
            onChange={(e) => onText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSubmit(textValue)}
            placeholder="Type your answer…"
            aria-label="Your answer"
            autoFocus
            className="input"
          />
          <div className="flex gap-2">
            <button onClick={() => onSubmit(textValue)} className="btn-primary btn-sm flex-1">
              <Check size={14} /> Save answer
            </button>
            <button onClick={onOther} className="btn-ghost btn-sm">
              Back to options
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => (o === 'Other' ? onOther() : onSubmit(o))}
            className="chip"
          >
            {o}
          </button>
        ))}
      </div>
    );
  }

  if (step.kind === 'multi') {
    return (
      <div className="space-y-2.5">
        <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">
          {options.map((o) => (
            <button
              key={o}
              onClick={() => onToggleMulti(o)}
              className={cn('chip', multiSel.includes(o) && 'chip-active')}
              aria-pressed={multiSel.includes(o)}
            >
              {multiSel.includes(o) && <Check size={12} strokeWidth={3.5} />}
              {o}
            </button>
          ))}
        </div>
        <input
          value={textValue}
          onChange={(e) => onText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const v = textValue.trim();
              if (v) onSubmit(v);
            }
          }}
          placeholder="Add a custom item…"
          aria-label="Add a custom item"
          className="input !py-2 text-[13px]"
        />
        <button onClick={onDoneMulti} className="btn-primary w-full">
          Done ({multiSel.length} selected) <ArrowRight size={15} />
        </button>
      </div>
    );
  }

  if (step.kind === 'date') {
    return (
      <div className="space-y-2">
        <input type="date" value={dateValue} onChange={(e) => onDate(e.target.value)} aria-label="Project deadline" className="input" />
        <div className="flex gap-2">
          <button onClick={() => onSubmit(dateValue || '__skip_deadline__')} className="btn-primary btn-sm flex-1">
            <Check size={14} /> Save date
          </button>
          <button onClick={() => onSubmit('__skip_deadline__')} className="btn-ghost btn-sm">
            No deadline
          </button>
        </div>
      </div>
    );
  }

  // text / number
  return (
    <div className="space-y-2">
      <input
        value={textValue}
        onChange={(e) => onText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSubmit(textValue)}
        placeholder={
          step.kind === 'number'
            ? 'e.g. 50–100'
            : step.id === 'notes'
              ? 'Extra notes, or skip…'
              : 'Type your answer…'
        }
        inputMode={step.kind === 'number' ? 'numeric' : undefined}
        aria-label="Your answer"
        autoFocus
        className="input"
      />
      <button onClick={() => onSubmit(textValue)} className="btn-primary w-full">
        <Check size={15} /> Save answer
      </button>
    </div>
  );
}