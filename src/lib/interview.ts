/* ------------------------------------------------------------------ */
/* Flow — conversational interview engine                              */
/* ------------------------------------------------------------------ */
/* Flow leads a one-question-at-a-time discovery interview. The engine */
/* below is fully deterministic and offline: it decides the next       */
/* question from the client's own answers, extracts structured values  */
/* from natural-language replies, never invents facts (unknown answers */
/* are stored as “Not provided”), and hands off to the existing        */
/* prototype generator when the brief is ready.                        */

import type { AiConversation, Client, FlowMessage } from '../types';
import { BUDGETS, CONTENT_PROVIDERS, FEATURES, INDUSTRIES, PAGES, PROJECT_TYPES } from './constants';
import { getTypeQuestions, type DynamicAnswer, type TypeQuestion } from './typeQuestions';
import { getTheme, THEMES } from '../themes';
import { cloneSnapshot, createVersion, nextVersionNumber, versionStatusFor } from './generator';
import { createSection, type SectionContext } from './prototypeSections';
import { uid } from './utils';

/* ------------------------------------------------------------------ */
/* Step model                                                          */
/* ------------------------------------------------------------------ */

export type FlowStepKind =
  | 'choice'
  | 'multi'
  | 'text'
  | 'number'
  | 'date'
  | 'yesno'
  | 'theme'
  | 'suggest'
  | 'summary'
  | 'missing'
  | 'review';

export interface FlowStep {
  id: string;
  kind: FlowStepKind;
  question: string | ((c: Client) => string);
  hint?: string;
  /** Client field key, or "dynamic.<id>" for website-type answers. */
  field?: string;
  options?: string[] | ((c: Client) => string[]);
}

export const GOAL_OPTIONS = [
  'Sell products',
  'Get leads / enquiries',
  'Build brand awareness',
  'Showcase work',
  'Get bookings',
  'Share information',
  'Online orders',
];

export const AUDIENCE_OPTIONS = [
  'Homeowners',
  'Businesses',
  'Interior designers',
  'General customers',
  'Students',
  'Professionals',
];

function businessOf(c: Client): string {
  return c.businessName?.trim() || c.company?.trim() || 'this business';
}

function themeNameOf(c: Client): string {
  return getTheme(c.theme)?.name ?? c.theme ?? 'this design';
}

function stepOptions(step: FlowStep, c: Client): string[] {
  const opts = typeof step.options === 'function' ? step.options(c) : step.options;
  return opts ?? [];
}

function dynamicStep(q: TypeQuestion): FlowStep {
  const kind: FlowStepKind =
    q.kind === 'yesno' ? 'yesno' : q.kind === 'multi' ? 'multi' : q.kind === 'number' ? 'number' : 'text';
  return {
    id: `dyn:${q.id}`,
    kind,
    field: `dynamic.${q.id}`,
    question: q.label,
    hint: q.hint,
    options: q.options,
  };
}

/* ------------------------------------------------------------------ */
/* The interview flow (ordered, adaptively assembled)                  */
/* ------------------------------------------------------------------ */

export function stepsFor(c: Client): FlowStep[] {
  const steps: FlowStep[] = [
    {
      id: 'businessName',
      kind: 'text',
      field: 'businessName',
      question: "What's the client's business called?",
      hint: "If there's no separate business name, use the client's name.",
    },
    {
      id: 'industry',
      kind: 'choice',
      field: 'industry',
      question: 'What industry is the business in?',
      options: INDUSTRIES,
    },
    {
      id: 'description',
      kind: 'text',
      field: 'description',
      question: (c) => `What does ${businessOf(c)} do — what do they sell or offer?`,
      hint: 'A sentence or two is enough; the prototype will build on it.',
    },
    {
      id: 'projectType',
      kind: 'choice',
      field: 'projectType',
      question: (c) => `What type of website does ${businessOf(c)} need?`,
      options: [...PROJECT_TYPES.map((t) => t.id)],
    },
  ];

  // Website-type specific questions — adapt to the selected type.
  const type = c.projectType;
  if (type) getTypeQuestions(type).forEach((q) => steps.push(dynamicStep(q)));

  steps.push(
    {
      id: 'projectGoal',
      kind: 'multi',
      field: 'projectGoal',
      question: "What's the main goal of the website?",
      options: GOAL_OPTIONS,
    },
    {
      id: 'targetAudience',
      kind: 'choice',
      field: 'targetAudience',
      question: 'Who are the main customers?',
      options: AUDIENCE_OPTIONS,
    },
    {
      id: 'deadline',
      kind: 'date',
      field: 'deadline',
      question: 'Is there a project deadline?',
      hint: 'Pick a date, or skip if there is none yet.',
    },
    {
      id: 'budget',
      kind: 'choice',
      field: 'budget',
      question: 'What is the project budget range?',
      options: BUDGETS,
    },
    {
      id: 'pages',
      kind: 'multi',
      field: 'pages',
      question: 'Which pages should the website include?',
      hint: "Type a custom page below if it's not listed.",
      options: PAGES,
    },
    {
      id: 'features',
      kind: 'multi',
      field: 'features',
      question: 'Which features should the website include?',
      hint: "Type a custom feature below if it's not listed.",
      options: FEATURES,
    },
    {
      id: 'contentProvider',
      kind: 'choice',
      field: 'contentProvider',
      question: 'Who will provide the website content?',
      options: CONTENT_PROVIDERS,
    },
    {
      id: 'notes',
      kind: 'text',
      field: 'notes',
      question: 'Anything else I should know about this project?',
      hint: "Extra requirements, references, do's and don'ts — or skip.",
    },
    {
      id: 'suggestions',
      kind: 'suggest',
      question: 'Based on what we know so far, I recommend these additions.',
    },
    {
      id: 'theme',
      kind: 'theme',
      field: 'theme',
      question: "Now let's decide how the website should feel.",
    }
  );

  if (c.theme) {
    steps.push({
      id: 'themeVisuals',
      kind: 'yesno',
      question: (c) =>
        `Since you're going with ${themeNameOf(c)}, strong visuals matter. Do you have professional photos of the business or products?`,
    });
  }

  steps.push(
    { id: 'missing', kind: 'missing', question: "Let me check what's still missing." },
    { id: 'summary', kind: 'summary', question: "Here's what I understood." }
  );

  if (c.prototype) steps.push({ id: 'review', kind: 'review', question: "I've reviewed the first version of the prototype." });

  return steps;
}

/* ------------------------------------------------------------------ */
/* Natural-language extraction (deterministic, never invents facts)    */
/* ------------------------------------------------------------------ */

function extractProjectType(raw: string): { value?: string; confidence: 'high' | 'low' } {
  const t = raw.toLowerCase();
  const rules: Array<[RegExp, string]> = [
    [/e-?commerce|online store|sell (products|items)|retail|shop/i, 'E-commerce'],
    [/restaurant|caf[eé]|food|menu|dining|bistro/i, 'Restaurant'],
    [/real estate|properties?|apartments?|housing|rentals?/i, 'Real Estate'],
    [/portfolio|showcase (my|our|their) work|my work/i, 'Portfolio'],
    [/saas|software|platform|web app/i, 'SaaS'],
    [/blog|articles|content site/i, 'Blog'],
    [/landing|lead gen|funnel|single page/i, 'Landing Page'],
    [/business website|company website|corporate|service business/i, 'Business Website'],
  ];
  for (const [re, value] of rules) if (re.test(t)) return { value, confidence: 'high' };
  return { confidence: 'low' };
}

function extractGoals(raw: string): { goals: string[]; whatsapp: boolean } {
  const t = raw.toLowerCase();
  const goals: string[] = [];
  const rules: Array<[RegExp, string]> = [
    [/sell|sales|product/i, 'Sell products'],
    [/lead|enquir|contact|whatsapp|quote|booking|enquiry/i, 'Get leads / enquiries'],
    [/brand|awareness|recognition/i, 'Build brand awareness'],
    [/showcase|portfolio|work/i, 'Showcase work'],
    [/book|reserv|appointment|schedule/i, 'Get bookings'],
    [/order/i, 'Online orders'],
    [/info|inform|educate|explain/i, 'Share information'],
  ];
  for (const [re, goal] of rules) if (re.test(t) && !goals.includes(goal)) goals.push(goal);
  return { goals, whatsapp: /whatsapp/i.test(t) };
}

function extractAudience(raw: string): { value?: string; confidence: 'high' | 'low' } {
  const t = raw.toLowerCase();
  const rules: Array<[RegExp, string]> = [
    [/home|families|residents/i, 'Homeowners'],
    [/business|b2b|companies|corporate/i, 'Businesses'],
    [/designer|architect|interior/i, 'Interior designers'],
    [/general|everyone|public/i, 'General customers'],
    [/student/i, 'Students'],
    [/professionals|doctors|lawyers/i, 'Professionals'],
  ];
  for (const [re, value] of rules) if (re.test(t)) return { value, confidence: 'high' };
  return { confidence: 'low' };
}

function extractNumber(raw: string): string | null {
  const m = raw.match(/\d[\d,]*(?:\s*[-–to]+\s*\d[\d,]*)?/);
  return m ? m[0].trim() : null;
}

function extractDate(raw: string): string | null {
  const t = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t; // already a date input value
  const m = t.match(/(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2,4})/);
  if (m) {
    const [, a, b, yRaw] = m;
    const y = yRaw.length === 2 ? `20${yRaw}` : yRaw;
    const first = Number(a) > 12 ? { d: a, mo: b } : { d: b, mo: a };
    const mo = first.mo.padStart(2, '0');
    const d = first.d.padStart(2, '0');
    if (Number(mo) >= 1 && Number(mo) <= 12 && Number(d) >= 1 && Number(d) <= 31) return `${y}-${mo}-${d}`;
  }
  const months: Record<string, number> = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
    jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
  };
  const named = t.match(/([a-z]{3})[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{2,4})/i);
  if (named && months[named[1].toLowerCase()]) {
    const y = named[3].length === 2 ? `20${named[3]}` : named[3];
    const mo = String(months[named[1].toLowerCase()]).padStart(2, '0');
    const d = named[2].padStart(2, '0');
    return `${y}-${mo}-${d}`;
  }
  return null;
}

function extractYesNo(raw: string): boolean | undefined {
  const t = raw.toLowerCase().trim();
  if (/^(not sure|maybe|unsure|don'?t know|no idea|probably|i don'?t know)/.test(t)) return undefined;
  if (/^(y|yes|yeah|yep|sure|definitely|absolutely|correct|right|of course)/.test(t)) return true;
  if (/^(n|no|nope|nah|not really|never|don'?t)/.test(t)) return false;
  return undefined;
}

function extractTheme(raw: string): { value?: string; confidence: 'high' | 'low' } {
  const t = raw.toLowerCase();
  const rules: Array<[RegExp, string]> = [
    [/dark|premium|black/i, 'dark-premium'],
    [/glass|aurora|glow|gradient/i, 'aurora-glass'],
    [/minimal|clean|white|simple/i, 'modern-minimal'],
    [/bento|saas|tech|modern/i, 'bento-saas'],
    [/brutal|bold|edgy/i, 'neo-brutalist'],
    [/editorial|magazine|serif|elegant/i, 'editorial'],
  ];
  for (const [re, value] of rules) if (re.test(t)) return { value, confidence: 'high' };
  return { confidence: 'low' };
}

function fuzzyOption(raw: string, options: string[]): string | undefined {
  const t = raw.toLowerCase().trim();
  return options.find(
    (o) => o.toLowerCase() === t || o.toLowerCase().includes(t) || t.includes(o.toLowerCase())
  );
}

/* ------------------------------------------------------------------ */
/* Answering                                                            */
/* ------------------------------------------------------------------ */

export interface StepAnswer {
  /** Robot acknowledgment shown after the answer. */
  ack: string;
  /** Client fields to write. */
  patch?: Partial<Client>;
  /** Website-type answers to write into dynamicAnswers. */
  dynamic?: Record<string, DynamicAnswer>;
  /** Structured value extracted (also stored on the user message). */
  value: string | string[] | boolean;
  /** Human-readable value for confirmations / messages. */
  label: string;
  /** Stay on the same step (e.g. custom page added) without advancing. */
  stay?: boolean;
  /** Ask the user to confirm an ambiguous interpretation first. */
  needsConfirm?: boolean;
  confirmQuestion?: string;
}

function dynamicFieldId(step: FlowStep): string | null {
  return step.field?.startsWith('dynamic.') ? step.field.slice('dynamic.'.length) : null;
}

function displayValue(value: string | string[] | boolean): string {
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return value;
}

/** Produces the robot's reply + the client patch for a given answer. */
export function answerStep(c: Client, step: FlowStep, raw: string, chosen?: string | string[]): StepAnswer {
  /* ---------------- conversation-only steps ---------------- */
  if (!step.field) {
    if (step.id === 'themeVisuals') {
      const yn = extractYesNo(raw);
      const label = yn === undefined ? 'Not provided' : yn ? 'Yes' : 'No';
      return {
        ack:
          yn === true
            ? 'Perfect — professional photos will really elevate this design.'
            : yn === false
              ? 'No problem — the prototype will use clearly-marked image placeholders you can swap later.'
              : "No problem — I'll note the photography as “Not provided” for now.",
        value: yn ?? 'Not provided',
        label,
      };
    }
    return { ack: 'Got it.', value: raw.trim() || 'Not provided', label: raw.trim() || 'Not provided' };
  }

  /* ---------------- website-type dynamic answers ---------------- */
  const dynId = dynamicFieldId(step);
  if (dynId) {
    const q = getTypeQuestions(c.projectType).find((x) => x.id === dynId);
    const short = q?.label ? q.label.replace(/\?$/, '') : step.id.replace('dyn:', '');

    if (step.kind === 'yesno') {
      const yn = extractYesNo(raw);
      if (yn === undefined) {
        return {
          ack: `No problem — I'll leave “${short}” as not provided for now.`,
          value: 'Not provided',
          label: 'Not provided',
        };
      }
      const v = yn;
      return {
        ack: `Noted — ${short}: ${v ? 'Yes' : 'No'}.`,
        patch: {},
        dynamic: { [dynId]: v },
        value: v,
        label: v ? 'Yes' : 'No',
      };
    }

    if (step.kind === 'number') {
      const num = extractNumber(raw) ?? (typeof chosen === 'string' ? chosen : null);
      if (!num) {
        return {
          ack: `I couldn't find a number there — I'll leave “${short}” open for now.`,
          value: 'Not provided',
          label: 'Not provided',
        };
      }
      const rough = /[-–to]/.test(num);
      return {
        ack: rough
          ? `Got it — approximately ${num}. Should I record that?`
          : `Got it — approximately ${num}.`,
        patch: {},
        dynamic: { [dynId]: num },
        value: num,
        label: num,
        ...(rough ? { needsConfirm: true, confirmQuestion: `Should I record approximately ${num}?` } : {}),
      };
    }

    if (step.kind === 'multi') {
      const list = (chosen as string[] | undefined) ?? (raw.trim() ? [raw.trim()] : []);
      return {
        ack: `Noted — ${short}: ${list.join(', ') || 'none selected'}.`,
        patch: {},
        dynamic: { [dynId]: list },
        value: list,
        label: list.join(', ') || 'Not provided',
      };
    }

    const v = raw.trim() || 'Not provided';
    return {
      ack: `Got it — I've saved that for “${short}”.`,
      patch: {},
      dynamic: { [dynId]: v },
      value: v,
      label: v,
    };
  }

  /* ---------------- core client fields ---------------- */
  switch (step.id) {
    case 'businessName': {
      const v = (chosen as string | undefined) ?? raw.trim();
      return { ack: `Got it — ${v}.`, patch: { businessName: v }, value: v, label: v };
    }
    case 'industry': {
      const picked = (chosen as string | undefined) ?? fuzzyOption(raw, INDUSTRIES) ?? raw.trim();
      const label = picked || 'Not provided';
      return {
        ack: `Great — ${label}. I'll keep that in mind for the design direction.`,
        patch: { industry: label },
        value: label,
        label,
      };
    }
    case 'description': {
      const v = raw.trim();
      return {
        ack: 'Understood — I\'ve saved that as the business description.',
        patch: { description: v },
        value: v || 'Not provided',
        label: v || 'Not provided',
      };
    }
    case 'projectType': {
      const picked = chosen as string | undefined;
      if (picked) {
        return {
          ack: `Perfect — so we're planning a ${picked} website.`,
          patch: { projectType: picked },
          value: picked,
          label: picked,
        };
      }
      const ex = extractProjectType(raw);
      if (ex.value) {
        return {
          ack: `Understood — I'll treat this as a ${ex.value} website.`,
          patch: { projectType: ex.value },
          value: ex.value,
          label: ex.value,
        };
      }
      const v = raw.trim() || 'Custom';
      return {
        ack: `Understood — I've noted the website type as “${v}”.`,
        patch: { projectType: v },
        value: v,
        label: v,
        needsConfirm: true,
        confirmQuestion: `Should I record the website type as “${v}”?`,
      };
    }
    case 'projectGoal': {
      if (Array.isArray(chosen) && chosen.length > 0) {
        const v = chosen.join(', ');
        return {
          ack: `Understood. I'll treat this as a ${chosen.join(' + ')} website.`,
          patch: { projectGoal: v },
          value: chosen,
          label: v,
        };
      }
      const { goals, whatsapp } = extractGoals(raw);
      if (goals.length > 0) {
        const v = goals.join(' + ');
        const patch: Partial<Client> = { projectGoal: v };
        if (whatsapp && !c.features.some((f) => /whatsapp/i.test(f))) {
          patch.features = [...c.features, 'WhatsApp Integration'];
        }
        return {
          ack:
            `Understood. I'll treat this as a ${v} website` +
            (whatsapp ? ', with WhatsApp for enquiries.' : '.'),
          patch,
          value: v,
          label: v,
        };
      }
      const v = raw.trim();
      return {
        ack: `Understood — I've noted the goal as “${v}”.`,
        patch: { projectGoal: v },
        value: v,
        label: v,
        needsConfirm: Boolean(v),
        confirmQuestion: v ? `Should I record the goal as “${v}”?` : undefined,
      };
    }
    case 'targetAudience': {
      const picked = (chosen as string | undefined) ?? extractAudience(raw).value ?? raw.trim();
      const label = picked || 'Not provided';
      return {
        ack: `Got it — the site will be designed for ${label}.`,
        patch: { targetAudience: label },
        value: label,
        label,
      };
    }
    case 'deadline': {
      const picked = chosen as string | undefined;
      const v = picked && picked !== '' ? picked : extractDate(raw);
      if (!v) {
        return {
          ack: "No problem — I'll leave the deadline open for now (marked “Not provided”).",
          value: '',
          label: 'Not provided',
        };
      }
      const pretty = new Date(v).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      return {
        ack: `Noted — target launch ${pretty}.`,
        patch: { deadline: v },
        value: v,
        label: pretty,
      };
    }
    case 'budget': {
      const picked = (chosen as string | undefined) ?? fuzzyOption(raw, BUDGETS) ?? raw.trim();
      const label = picked || 'Not provided';
      return {
        ack: `Noted — budget: ${label}.`,
        patch: { budget: label },
        value: label,
        label,
      };
    }
    case 'pages': {
      const list = chosen as string[] | undefined;
      if (list) {
        const v = list;
        return {
          ack: `Locked in: ${v.join(', ') || 'no pages selected yet'}.`,
          patch: { pages: v },
          value: v,
          label: v.join(', ') || 'Not provided',
        };
      }
      // Free-text while on the pages step → custom page.
      const v = raw.trim();
      if (!v) return { ack: 'Got it.', value: '', label: 'Not provided' };
      const already = [...c.pages, ...c.customPages].some((p) => p.toLowerCase() === v.toLowerCase());
      if (already) {
        return { ack: `“${v}” is already on the list.`, value: '', label: v, stay: true };
      }
      return {
        ack: `Added “${v}” as a custom page. Anything else, or tap Done to continue.`,
        patch: { customPages: [...c.customPages, v] },
        value: v,
        label: v,
        stay: true,
      };
    }
    case 'features': {
      const list = chosen as string[] | undefined;
      if (list) {
        const v = list;
        return {
          ack: `Added: ${v.join(', ') || 'no features selected yet'}.`,
          patch: { features: v },
          value: v,
          label: v.join(', ') || 'Not provided',
        };
      }
      const v = raw.trim();
      if (!v) return { ack: 'Got it.', value: '', label: 'Not provided' };
      const already = [...c.features, ...c.customFeatures].some((f) => f.toLowerCase() === v.toLowerCase());
      if (already) {
        return { ack: `“${v}” is already on the list.`, value: '', label: v, stay: true };
      }
      return {
        ack: `Added “${v}” as a custom feature. Anything else, or tap Done to continue.`,
        patch: { customFeatures: [...c.customFeatures, v] },
        value: v,
        label: v,
        stay: true,
      };
    }
    case 'contentProvider': {
      const picked = (chosen as string | undefined) ?? fuzzyOption(raw, CONTENT_PROVIDERS) ?? raw.trim();
      const label = picked || 'Not provided';
      return {
        ack: `Got it — content will be provided by ${label}.`,
        patch: { contentProvider: label },
        value: label,
        label,
      };
    }
    case 'notes': {
      const v = raw.trim();
      return {
        ack: 'Perfect — I\'ve saved your notes.',
        patch: { notes: v },
        value: v || 'Not provided',
        label: v || 'Not provided',
      };
    }
    case 'theme': {
      const picked = (chosen as string | undefined) ?? extractTheme(raw).value;
      if (picked) {
        const name = getTheme(picked)?.name ?? picked;
        const tip = THEME_TIPS[picked];
        return {
          ack: `Nice choice — ${name}.${tip ? ` ${tip}` : ''}`,
          patch: { theme: picked },
          value: picked,
          label: name,
        };
      }
      return {
        ack: 'Pick a theme from the cards below, or describe the feel (e.g. “dark and premium”).',
        value: '',
        label: 'Not provided',
        stay: true,
      };
    }
    default:
      return { ack: 'Got it.', value: raw.trim() || 'Not provided', label: raw.trim() || 'Not provided' };
  }
}

const THEME_TIPS: Record<string, string> = {
  'modern-minimal': 'Clean typography and spacious layouts will help premium products stand out.',
  'bento-saas': 'The bento grid and blue/purple palette give it a modern product-led feel.',
  'dark-premium': "Since you're going with Dark Premium, I'd recommend strong photography and fewer text-heavy sections.",
  'aurora-glass': 'Aurora Glass shines with glowing accents — keep copy short and let the gradients breathe.',
  'neo-brutalist': 'Bold borders and high contrast make a confident, creative statement.',
  editorial: 'Large typography and magazine-style layouts suit an image-led, sophisticated brand.',
};

/* ------------------------------------------------------------------ */
/* Recommendations (derived from the client's own answers)             */
/* ------------------------------------------------------------------ */

export interface Recommendations {
  pages: string[];
  features: string[];
}

export function recommendationsFor(c: Client): Recommendations {
  const type = c.projectType;
  const maps: Record<string, { pages: string[]; features: string[] }> = {
    'E-commerce': {
      pages: ['Shop', 'Product Details', 'Cart', 'Checkout', 'Account'],
      features: ['Shopping Cart', 'Payment Gateway', 'Wishlist', 'Reviews'],
    },
    Restaurant: {
      pages: ['Menu', 'Gallery'],
      features: ['WhatsApp Integration', 'Google Maps', 'Booking System', 'Reviews'],
    },
    'Real Estate': {
      pages: ['Properties', 'Agents'],
      features: ['Google Maps', 'Contact Form'],
    },
    SaaS: {
      pages: ['Pricing', 'Documentation', 'Blog'],
      features: ['User Login', 'User Registration', 'Payment Gateway', 'Analytics'],
    },
    Portfolio: {
      pages: ['Projects', 'Case Studies'],
      features: ['Social Media Integration', 'Contact Form', 'Reviews'],
    },
    Blog: {
      pages: ['Blog', 'About', 'Contact'],
      features: ['Newsletter', 'Search', 'Social Media Integration'],
    },
    'Landing Page': {
      pages: ['Contact', 'FAQ'],
      features: ['Contact Form', 'Newsletter', 'Analytics'],
    },
    'Business Website': {
      pages: ['Services', 'About', 'Contact'],
      features: ['WhatsApp Integration', 'Google Maps', 'Contact Form', 'Booking System', 'Reviews'],
    },
  };
  const base = maps[type] ?? { pages: [], features: [] };
  const selectedPages = [...c.pages, ...c.customPages].map((p) => p.toLowerCase());
  const selectedFeatures = [...c.features, ...c.customFeatures].map((f) => f.toLowerCase());
  return {
    pages: base.pages.filter((p) => !selectedPages.includes(p.toLowerCase())).slice(0, 4),
    features: base.features.filter((f) => !selectedFeatures.includes(f.toLowerCase())).slice(0, 4),
  };
}

/* ------------------------------------------------------------------ */
/* Theme recommendation                                                */
/* ------------------------------------------------------------------ */

export function recommendTheme(c: Client): { id: string; name: string; reason: string } {
  const industry = (c.industry || '').toLowerCase();
  const type = c.projectType;
  let id = 'modern-minimal';
  let reason = 'Clean typography and spacious layouts will help premium products stand out.';
  if (type === 'Restaurant') {
    id = 'editorial';
    reason = 'Rich typography and image-led layouts will make the menu and food photography stand out.';
  } else if (type === 'Real Estate') {
    id = 'dark-premium';
    reason = 'High-contrast premium visuals suit property showcases.';
  } else if (type === 'SaaS' || /technology|software|tech/.test(industry)) {
    id = 'bento-saas';
    reason = 'The classic SaaS aesthetic with bento cards fits product-led websites.';
  } else if (type === 'Portfolio' || /interior|design|creative|fashion/.test(industry)) {
    id = 'aurora-glass';
    reason = 'A luminous, creative feel matches a portfolio beautifully.';
  }
  return { id, name: getTheme(id)?.name ?? id, reason };
}

/* ------------------------------------------------------------------ */
/* Readiness + missing information                                     */
/* ------------------------------------------------------------------ */

export function readiness(c: Client): number {
  const checks = [
    Boolean(c.businessName?.trim()),
    Boolean(c.industry?.trim()),
    Boolean(c.description?.trim()),
    Boolean(c.projectType?.trim()),
    Boolean(c.projectGoal?.trim()),
    Boolean(c.targetAudience?.trim()),
    Boolean(c.deadline?.trim()),
    Boolean(c.budget?.trim()),
    Boolean(c.contentProvider?.trim()),
    c.pages.length > 0,
    c.features.length > 0,
    Boolean(c.theme?.trim()),
    Boolean(c.notes?.trim()),
    Boolean(c.dynamicAnswers && Object.keys(c.dynamicAnswers).length > 0),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export function missingImportant(c: Client): Array<{ field: string; label: string }> {
  const missing: Array<{ field: string; label: string }> = [];
  if (!c.deadline?.trim()) missing.push({ field: 'deadline', label: 'Project deadline' });
  if (!c.budget?.trim()) missing.push({ field: 'budget', label: 'Budget' });
  if (!c.contentProvider?.trim()) missing.push({ field: 'contentProvider', label: 'Content provider' });
  if (!c.theme?.trim()) missing.push({ field: 'theme', label: 'Design style (theme)' });
  if (c.pages.length === 0) missing.push({ field: 'pages', label: 'Required pages' });
  if (c.features.length === 0) missing.push({ field: 'features', label: 'Required features' });
  if (!c.targetAudience?.trim()) missing.push({ field: 'targetAudience', label: 'Target audience' });
  return missing.slice(0, 3);
}

/* ------------------------------------------------------------------ */
/* Summary card                                                        */
/* ------------------------------------------------------------------ */

export function summaryOf(c: Client): Array<{ label: string; value: string }> {
  const type = c.projectType;
  return [
    { label: 'Client', value: c.name?.trim() || 'Not provided' },
    { label: 'Business', value: businessOf(c) },
    { label: 'Industry', value: c.industry?.trim() || 'Not provided' },
    { label: 'Website', value: type?.trim() || 'Not provided' },
    { label: 'Goal', value: c.projectGoal?.trim() || 'Not provided' },
    { label: 'Audience', value: c.targetAudience?.trim() || 'Not provided' },
    { label: 'Budget', value: c.budget?.trim() || 'Not provided' },
    { label: 'Deadline', value: c.deadline?.trim() || 'Not provided' },
    {
      label: 'Pages',
      value: [...c.pages, ...c.customPages].join(', ') || 'Not provided',
    },
    {
      label: 'Features',
      value: [...c.features, ...c.customFeatures].join(', ') || 'Not provided',
    },
    { label: 'Theme', value: getTheme(c.theme)?.name ?? c.theme ?? 'Not selected' },
  ];
}

/* ------------------------------------------------------------------ */
/* Goal-based CTA + post-prototype review                              */
/* ------------------------------------------------------------------ */

export function goalCta(c: Client): string {
  const goal = (c.projectGoal || '').toLowerCase();
  if (/quote|estimate/.test(goal)) return 'Get a quote';
  switch (c.projectType) {
    case 'E-commerce':
      return 'Shop now';
    case 'Restaurant':
      return 'Book a table';
    case 'Real Estate':
      return 'View properties';
    case 'Portfolio':
      return 'View our work';
    case 'SaaS':
      return 'Start free trial';
    case 'Blog':
      return 'Read the blog';
    case 'Landing Page':
      return 'Get started';
    default:
      return 'Get in touch';
  }
}

export interface ReviewSuggestion {
  id: string;
  text: string;
}

export function reviewSuggestionsFor(c: Client): ReviewSuggestion[] {
  if (!c.prototype) return [];
  const out: ReviewSuggestion[] = [];
  const home = c.prototype.pages[0];
  const hero = home?.sections.find((s) => s.type === 'hero');
  if (hero?.cta) {
    const generic = ['Get in touch', 'Learn more', 'Get started', 'Contact us', 'Enquire'];
    if (generic.includes(hero.cta.label)) {
      out.push({
        id: 'hero-cta',
        text: `Make the hero CTA more specific — e.g. “${goalCta(c)}” based on the project goal.`,
      });
    }
  }
  if (c.projectType === 'E-commerce' && c.pages.some((p) => /shop|product/i.test(p))) {
    out.push({ id: 'category-nav', text: 'Add product category navigation so shoppers can browse by category.' });
  }
  if (
    [...c.features, ...c.customFeatures].some((f) => /review|testimonial/i.test(f)) &&
    home &&
    !home.sections.some((s) => s.type === 'testimonials')
  ) {
    out.push({ id: 'reviews', text: 'Add customer reviews near the main offer to build trust.' });
  }
  return out.slice(0, 3);
}

function sectionCtx(c: Client): SectionContext {
  return {
    business: businessOf(c),
    industry: c.industry,
    description: c.description,
    projectGoal: c.projectGoal,
    targetAudience: c.targetAudience,
    features: [...c.features, ...c.customFeatures],
    notes: c.notes,
    theme: c.theme,
    pageLabel: 'Home',
    websiteType: c.projectType,
    dynamicAnswers: c.dynamicAnswers,
  };
}

/** Applies the safe, data-grounded review suggestions to the current prototype
    and creates a new version (previous versions are preserved). */
export function applyReviewSuggestions(c: Client): { client: Client; applied: string[] } {
  if (!c.prototype) return { client: c, applied: [] };
  const snapshot = cloneSnapshot(c.prototype);
  const applied: string[] = [];
  const home = snapshot.pages[0];

  const hero = home?.sections.find((s) => s.type === 'hero');
  if (hero?.cta) {
    const generic = ['Get in touch', 'Learn more', 'Get started', 'Contact us', 'Enquire'];
    if (generic.includes(hero.cta.label)) {
      hero.cta = { label: goalCta(c), href: hero.cta.href };
      applied.push('Made the hero CTA more specific');
    }
  }
  if (
    [...c.features, ...c.customFeatures].some((f) => /review|testimonial/i.test(f)) &&
    home &&
    !home.sections.some((s) => s.type === 'testimonials')
  ) {
    home.sections.push(createSection('testimonials', sectionCtx(c)));
    applied.push('Added customer reviews near the main offer');
  }

  if (applied.length === 0) return { client: c, applied };
  const versions = c.prototypeVersions ?? [];
  const version = {
    ...createVersion(snapshot, versionStatusFor(c.status)),
    number: nextVersionNumber(versions),
  };
  return {
    client: { ...c, prototype: snapshot, prototypeVersions: [...versions, version] },
    applied,
  };
}

/* ------------------------------------------------------------------ */
/* Commands                                                            */
/* ------------------------------------------------------------------ */

export type FlowCommand =
  | { type: 'skip' }
  | { type: 'back' }
  | { type: 'restart' }
  | { type: 'generate' }
  | { type: 'themes' }
  | { type: 'missing' }
  | { type: 'answers' }
  | { type: 'premium' }
  | { type: 'improve' }
  | { type: 'add'; arg: string }
  | { type: 'remove'; arg: string }
  | null;

export function parseCommand(raw: string): FlowCommand {
  const t = raw.trim();
  if (!t) return null;
  const lower = t.toLowerCase();
  if (/^(skip|next|pass|continue)$/i.test(lower)) return { type: 'skip' };
  if (/^(go\s*)?back|previous|change answer/i.test(lower)) return { type: 'back' };
  if (/^(start over|restart|reset|from scratch)$/i.test(lower)) return { type: 'restart' };
  if (/^generate|create (the )?prototype|build (the )?website/i.test(lower)) return { type: 'generate' };
  if (/^(show|see|pick) (me )?(the )?themes?$/i.test(lower)) return { type: 'themes' };
  if (/^(review|what(')?s missing|find missing|what (do i )?still need)/i.test(lower)) return { type: 'missing' };
  if (/^(review answers|show (me )?(the )?summary|what did (i|we) say)$/i.test(lower)) return { type: 'answers' };
  if (/more premium|premium feel|make it (more )?premium/i.test(lower)) return { type: 'premium' };
  if (/^improve (this|it)|make it better/i.test(lower)) return { type: 'improve' };
  const add = t.match(/^(add|include|need)\s+(.+)$/i);
  if (add) return { type: 'add', arg: add[2].trim() };
  const remove = t.match(/^(remove|drop|delete|no|not|don'?t want)\s+(.+)$/i);
  if (remove) return { type: 'remove', arg: remove[2].trim() };
  return null;
}

/* ------------------------------------------------------------------ */
/* Greeting / conversation helpers                                     */
/* ------------------------------------------------------------------ */

export function freshConversation(c: Client): AiConversation {
  const now = Date.now();
  const messages: FlowMessage[] = [
    { id: uid(), role: 'agent', content: "Hi! I'm Flow 👋", timestamp: now },
    {
      id: uid(),
      role: 'agent',
      content: `I'm going to help you understand ${businessOf(c)}'s website requirements. I'll ask a few simple questions and suggest what might work best.`,
      timestamp: now + 1,
    },
  ];
  const hasData =
    c.businessName || c.industry || c.projectType || c.pages.length > 0 || c.features.length > 0;
  if (hasData) {
    messages.push({
      id: uid(),
      role: 'agent',
      content:
        "I can see you've already collected some information for this client — I'll build on it, and you can skip anything that's already filled in.",
      timestamp: now + 2,
    });
  }
  return {
    id: uid(),
    messages,
    currentStep: '',
    history: [],
    skipped: [],
    startedAt: now,
    updatedAt: now,
    started: false,
  };
}

export function stepOptionsFor(step: FlowStep, c: Client): string[] {
  return stepOptions(step, c);
}

export const ALL_THEMES = THEMES;