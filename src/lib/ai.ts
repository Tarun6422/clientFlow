import type { PrototypeSectionType, Settings } from '../types';
import { getTheme } from '../themes';

/* ------------------------------------------------------------------ */
/* AI service abstraction                                              */
/* ------------------------------------------------------------------ */
/* The whole app talks to an `AIProvider`. The default `local` provider
   is a deterministic, offline template engine — it always works and
   never invents client facts. If the user configures an OpenAI-compatible
   endpoint + key in Settings, a `custom` provider is used instead and
   gracefully falls back to the local engine whenever the API is
   unreachable. No API keys are hardcoded anywhere. */

export interface AIContext {
  business: string;
  industry: string;
  description: string;
  projectGoal: string;
  targetAudience: string;
  theme: string;
  pageLabel: string;
  sectionType: PrototypeSectionType;
  sectionTitle: string;
  sectionSubtitle: string;
}

export interface SuggestSectionResult {
  type: PrototypeSectionType;
  title: string;
  subtitle: string;
}

/* Context for the generation pipeline (analysis / sitemap enhancement).
   Only client-provided facts are included — never private or generated data. */
export interface GenerationContext {
  business: string;
  industry: string;
  projectType: string;
  projectGoal: string;
  targetAudience: string;
  features: string[];
  pages: string[];
  theme: string;
  dynamicSummary: string;
}

export interface AnswerInterpretation {
  field: string;
  value: string | string[] | boolean;
  confidence: 'high' | 'medium' | 'low';
}

export interface AIProvider {
  id: 'local' | 'custom';
  label: string;
  available: boolean;
  /** True when the custom provider fell back to the local engine at least
      once (API unreachable, missing config, or invalid response). */
  fellBack: boolean;
  improveCopy(text: string, ctx: AIContext): Promise<string>;
  rewriteHeading(text: string, ctx: AIContext): Promise<string>;
  generateCta(ctx: AIContext): Promise<string>;
  suggestSection(ctx: AIContext): Promise<SuggestSectionResult>;
  improveUx(ctx: AIContext): Promise<string>;
  generateSeoTitle(ctx: AIContext): Promise<string>;
  /** Generation pipeline: suggest extra sitemap pages. `null` = no change. */
  suggestSitemapPages(ctx: GenerationContext): Promise<string[] | null>;
  /** Generation pipeline: suggest plan improvements. `null` = no change. */
  suggestImprovements(ctx: GenerationContext): Promise<string[] | null>;
  /** Flow interview: interpret a free-text answer into a structured value.
      `null` means "use the deterministic local interpretation". The result
      is validated against the caller's expectations before it is used, so
      a model mistake can never invent client facts. */
  interpretAnswer(
    question: string,
    answer: string,
    opts: { field: string; options?: string[] }
  ): Promise<AnswerInterpretation | null>;
}

/* ------------------------------------------------------------------ */
/* Shared helpers                                                      */
/* ------------------------------------------------------------------ */

function firstSentence(text: string, fallback: string): string {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return fallback;
  const idx = clean.search(/[.!?](?:\s|$)/);
  return idx > -1 ? clean.slice(0, idx + 1) : clean;
}

function ensurePeriod(text: string): string {
  const t = text.trim();
  if (!t) return t;
  return /[.!?]$/.test(t) ? t : `${t}.`;
}

function businessOf(ctx: AIContext): string {
  return ctx.business || 'our business';
}

/* ------------------------------------------------------------------ */
/* Local (offline) provider                                            */
/* ------------------------------------------------------------------ */

const COPY_VARIANTS = [
  (t: string, ctx: AIContext) =>
    ensurePeriod(t) +
    ` We tailor every detail of ${businessOf(ctx)}'s online presence around the goal of ${ctx.projectGoal ? lowerFirst(firstSentence(ctx.projectGoal, 'serving customers better')) : 'serving customers better'}`,
  (t: string, ctx: AIContext) =>
    `From a clear first impression to a final call to action, ${ensurePeriod(lowerFirst(t))} Everything is built to help ${ctx.targetAudience ? lowerFirst(firstSentence(ctx.targetAudience, 'your customers')) : 'your customers'} find what they need and act on it.`,
  (t: string, ctx: AIContext) =>
    ensurePeriod(t) +
    ` The experience reflects ${businessOf(ctx)} — ${ctx.industry ? lowerFirst(firstSentence(ctx.industry, 'the industry')) : 'the industry'} — while keeping every step simple, fast and human.`,
  (t: string, ctx: AIContext) =>
    `More than words on a screen, ${lowerFirst(ensurePeriod(t))} This section is designed to guide visitors toward the next step — ${ctx.projectGoal ? lowerFirst(firstSentence(ctx.projectGoal, 'converting them into customers')) : 'converting them into customers'}.`,
];

const HEADING_VARIANTS = [
  (t: string, ctx: AIContext) => `Make it easy for customers to choose ${businessOf(ctx)}`,
  (t: string, ctx: AIContext) => `${businessOf(ctx)} — built around what your customers need`,
  (t: string, ctx: AIContext) => `The smarter way to ${ctx.projectGoal ? lowerFirst(firstSentence(ctx.projectGoal, 'work with us')) : 'work with us'}`,
  (t: string, ctx: AIContext) => `Experience ${ctx.industry ? lowerFirst(firstSentence(ctx.industry, 'the difference')) : 'the difference'} with ${businessOf(ctx)}`,
  (t: string, ctx: AIContext) => `Why ${ctx.targetAudience ? lowerFirst(firstSentence(ctx.targetAudience, 'customers')) : 'customers'} choose ${businessOf(ctx)}`,
];

const CTA_VARIANTS = [
  (ctx: AIContext) => (ctx.targetAudience ? 'Get started today' : 'Get in touch'),
  (ctx: AIContext) => (ctx.targetAudience ? 'Start your project' : 'Contact us'),
  (ctx: AIContext) => (ctx.projectGoal ? 'Request a quote' : 'Book a call'),
  (ctx: AIContext) => (ctx.industry ? 'Explore our services' : 'Learn more'),
  (ctx: AIContext) => 'Talk to our team',
];

const UX_SUGGESTIONS = [
  (ctx: AIContext) =>
    `Add a sticky call-to-action near the top of the page so visitors never have to scroll to find the next step — keep it visible on mobile.`,
  (ctx: AIContext) =>
    `Break this long section into a two-column layout with a short benefit list on one side and a visual on the other; scan rates improve dramatically.`,
  (ctx: AIContext) =>
    `Lead with the outcome, not the process: open with "${ctx.projectGoal ? firstSentence(ctx.projectGoal, 'what customers gain') : 'what customers gain'}" and keep supporting details below.`,
  (ctx: AIContext) =>
    `Add social proof directly under the primary call to action — a short testimonial or a “trusted by” strip — to reduce hesitation at the decision point.`,
  (ctx: AIContext) =>
    `Ensure headings are descriptive and consistent in style so users can scan the page in under five seconds and still understand the offer.`,
];

const SECTION_SUGGESTIONS: Array<(ctx: AIContext) => SuggestSectionResult> = [
  (ctx) => ({
    type: 'features',
    title: 'Why choose us',
    subtitle: `A quick overview of what makes ${businessOf(ctx)} stand out`,
  }),
  (ctx) => ({
    type: 'testimonials',
    title: 'What our clients say',
    subtitle: 'Real feedback builds trust at the moment of decision',
  }),
  (ctx) => ({
    type: 'stats',
    title: 'Results that matter',
    subtitle: 'Quick, honest numbers — add real figures when available',
  }),
  (ctx) => ({
    type: 'faq',
    title: 'Frequently asked questions',
    subtitle: 'Answer the questions customers ask most before they ask',
  }),
  (ctx) => ({
    type: 'cta',
    title: 'Ready to get started?',
    subtitle: ctx.projectGoal ? firstSentence(ctx.projectGoal, 'Take the next step today') : 'Take the next step today',
  }),
  (ctx) => ({
    type: 'gallery',
    title: 'A look inside',
    subtitle: 'Show real photos of the work, space or products',
  }),
];

function lowerFirst(s: string): string {
  if (!s) return s;
  return s.charAt(0).toLowerCase() + s.slice(1);
}

function pick<T>(arr: T[], seed: string): T {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return arr[h % arr.length];
}

class LocalAIProvider implements AIProvider {
  id = 'local' as const;
  label = 'Built-in AI (offline)';
  available = true;
  fellBack = false;

  async improveCopy(text: string, ctx: AIContext): Promise<string> {
    if (!text.trim()) return COPY_VARIANTS[0]('Describe what this section offers.', ctx);
    return pick(COPY_VARIANTS, text + ctx.business)(text, ctx);
  }

  async rewriteHeading(text: string, ctx: AIContext): Promise<string> {
    const variants = HEADING_VARIANTS.filter((v) => {
      const out = v(text, ctx);
      return out.toLowerCase() !== text.trim().toLowerCase();
    });
    return pick(variants.length ? variants : HEADING_VARIANTS, text + ctx.business)(text, ctx);
  }

  async generateCta(ctx: AIContext): Promise<string> {
    return pick(CTA_VARIANTS, ctx.pageLabel + ctx.sectionType)(ctx);
  }

  async suggestSection(ctx: AIContext): Promise<SuggestSectionResult> {
    return pick(SECTION_SUGGESTIONS, ctx.pageLabel + ctx.sectionType)(ctx);
  }

  async improveUx(_ctx: AIContext): Promise<string> {
    const seed = `${_ctx.pageLabel}-${_ctx.sectionType}-${_ctx.business}`;
    return pick(UX_SUGGESTIONS, seed)(_ctx);
  }

  async generateSeoTitle(ctx: AIContext): Promise<string> {
    const parts = [ctx.business, ctx.industry, ctx.targetAudience ? firstSentence(ctx.targetAudience, '') : ''].filter(Boolean);
    const base = parts.length ? parts.join(' | ') : 'Home';
    const themeName = getTheme(ctx.theme)?.name ?? '';
    return `${base}${themeName ? ` — ${themeName} Website` : ''}`;
  }

  /* The local engine is already the deterministic fallback — no changes. */
  async suggestSitemapPages(_ctx: GenerationContext): Promise<string[] | null> {
    return null;
  }

  async suggestImprovements(_ctx: GenerationContext): Promise<string[] | null> {
    return null;
  }

  /* Deterministic extraction is the authoritative interpretation; the local
     provider defers to it (returns null). */
  async interpretAnswer(): Promise<AnswerInterpretation | null> {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Custom (OpenAI-compatible) provider — falls back to local           */
/* ------------------------------------------------------------------ */

const SYSTEM_PROMPT = `You are the AI design assistant inside ClientFlow, a website planning and UI/UX prototyping tool.
You help polish prototype copy and suggest improvements. You must NEVER invent client facts: no prices, deadlines, services, business details or client information that were not provided.
If something is unknown, say so and keep the text generic. Reply with plain text only, no markdown, no quotes around the answer.`;

function systemPromptWith(ctx: AIContext): string {
  return `${SYSTEM_PROMPT}\n\nContext about the client (only what was provided):\n- Business: ${ctx.business || 'Not provided'}\n- Industry: ${ctx.industry || 'Not provided'}\n- Description: ${ctx.description || 'Not provided'}\n- Project goal: ${ctx.projectGoal || 'Not provided'}\n- Target audience: ${ctx.targetAudience || 'Not provided'}\n- Theme: ${ctx.theme || 'Not provided'}\n- Current page: ${ctx.pageLabel || 'Not provided'}`;
}

class CustomAIProvider implements AIProvider {
  id = 'custom' as const;
  label = 'Custom AI endpoint';
  available = true;
  fellBack = false;
  private fallback = new LocalAIProvider();

  constructor(private settings: Settings) {}

  private async run(prompt: string, ctx: AIContext, fallback: () => string | Promise<string>): Promise<string> {
    const { aiEndpoint, aiApiKey, aiModel } = this.settings;
    if (!aiEndpoint || !aiApiKey) {
      this.fellBack = true;
      return Promise.resolve(fallback());
    }
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(`${aiEndpoint.replace(/\/+$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${aiApiKey}`,
        },
        body: JSON.stringify({
          model: aiModel || 'gpt-4o-mini',
          temperature: 0.7,
          max_tokens: 260,
          messages: [
            { role: 'system', content: systemPromptWith(ctx) },
            { role: 'user', content: prompt },
          ],
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) {
        this.fellBack = true;
        return Promise.resolve(fallback());
      }
      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = data.choices?.[0]?.message?.content?.trim();
      if (!content) {
        this.fellBack = true;
        return Promise.resolve(fallback());
      }
      return content.replace(/^["']|["']$/g, '');
    } catch {
      this.fellBack = true;
      return Promise.resolve(fallback());
    }
  }

  improveCopy(text: string, ctx: AIContext): Promise<string> {
    return this.run(
      `Improve this website section copy (keep it factual and generic, do not invent facts about the business):\n\n"${text}"`,
      ctx,
      () => this.fallback.improveCopy(text, ctx)
    );
  }

  rewriteHeading(text: string, ctx: AIContext): Promise<string> {
    return this.run(
      `Rewrite this section heading in a stronger, clearer way. Do not invent facts:\n\n"${text}"`,
      ctx,
      () => this.fallback.rewriteHeading(text, ctx)
    );
  }

  generateCta(ctx: AIContext): Promise<string> {
    return this.run(
      `Suggest a short call-to-action button label for the "${ctx.sectionTitle || ctx.sectionType}" section on the ${ctx.pageLabel} page. Give one option, 2-4 words.`,
      ctx,
      () => this.fallback.generateCta(ctx)
    );
  }

  suggestSection(ctx: AIContext): Promise<SuggestSectionResult> {
    return this.run(
      `Suggest ONE website section that would strengthen the "${ctx.pageLabel}" page for this client. Reply as: TYPE | Title | One-line subtitle. TYPE must be one of: hero, features, services, products, testimonials, cta, stats, gallery, logos, contact, faq, team, pricing, blog, cards, text.`,
      ctx,
      async () => {
        const r = await this.fallback.suggestSection(ctx);
        return `${r.type} | ${r.title} | ${r.subtitle}`;
      }
    ).then((raw) => {
      const [type, title, ...rest] = raw.split('|').map((s) => s.trim());
      const valid = [
        'hero', 'features', 'services', 'products', 'testimonials', 'cta', 'stats',
        'gallery', 'logos', 'contact', 'faq', 'team', 'pricing', 'blog', 'cards', 'text',
      ] as const;
      if (type && (valid as readonly string[]).includes(type) && title) {
        return { type: type as PrototypeSectionType, title, subtitle: rest.join(' | ') };
      }
      return this.fallback.suggestSection(ctx);
    });
  }

  improveUx(ctx: AIContext): Promise<string> {
    return this.run(
      `Give ONE concrete, actionable UX improvement for the "${ctx.sectionTitle || ctx.sectionType}" section of the ${ctx.pageLabel} page. One short paragraph, no markdown.`,
      ctx,
      () => this.fallback.improveUx(ctx)
    );
  }

  generateSeoTitle(ctx: AIContext): Promise<string> {
    return this.run(
      `Generate an SEO title tag (max 60 characters) for the ${ctx.pageLabel} page of ${ctx.business || 'the website'}. Only use provided facts.`,
      ctx,
      () => this.fallback.generateSeoTitle(ctx)
    );
  }

  async suggestSitemapPages(ctx: GenerationContext): Promise<string[] | null> {
    const summary = [
      `Business: ${ctx.business || 'Not provided'}`,
      `Industry: ${ctx.industry || 'Not provided'}`,
      `Website type: ${ctx.projectType || 'Not provided'}`,
      `Goal: ${ctx.projectGoal || 'Not provided'}`,
      `Features: ${ctx.features.join(', ') || 'Not provided'}`,
      `Current pages: ${ctx.pages.join(', ') || 'Not provided'}`,
      ctx.dynamicSummary ? `Website type requirements: ${ctx.dynamicSummary}` : '',
    ]
      .filter(Boolean)
      .join('\n');
    const prompt =
      `Based ONLY on the client information below, suggest up to 3 additional website pages that would strengthen this site. ` +
      `Reply with the page names only, one per line. Do not restate pages that already exist. Do not invent business facts.\n\n${summary}`;
    const raw = await this.run(prompt, emptyAIContext(ctx), () => '');
    if (!raw.trim()) return null;
    const pages = raw
      .split(/[\n;]+/)
      .map((line) => line.replace(/^[-•*\d.\s]+/, '').trim())
      .filter((line) => line.length > 1 && line.length < 40)
      .slice(0, 3);
    return pages.length > 0 ? pages : null;
  }

  async suggestImprovements(ctx: GenerationContext): Promise<string[] | null> {
    const summary = [
      `Business: ${ctx.business || 'Not provided'}`,
      `Industry: ${ctx.industry || 'Not provided'}`,
      `Website type: ${ctx.projectType || 'Not provided'}`,
      `Target audience: ${ctx.targetAudience || 'Not provided'}`,
      `Goal: ${ctx.projectGoal || 'Not provided'}`,
      ctx.dynamicSummary ? `Website type requirements: ${ctx.dynamicSummary}` : '',
    ]
      .filter(Boolean)
      .join('\n');
    const prompt =
      `Give up to 3 concise, actionable suggestions to improve this website plan. They must be generic advice — ` +
      `never invent prices, business facts or client details. Reply with one suggestion per line, plain text.\n\n${summary}`;
    const raw = await this.run(prompt, emptyAIContext(ctx), () => '');
    if (!raw.trim()) return null;
    const items = raw
      .split(/[\n;]+/)
      .map((line) => line.replace(/^[-•*\d.\s]+/, '').trim())
      .filter((line) => line.length > 4 && line.length < 240)
      .slice(0, 3);
    return items.length > 0 ? items : null;
  }

  async interpretAnswer(
    question: string,
    answer: string,
    opts: { field: string; options?: string[] }
  ): Promise<AnswerInterpretation | null> {
    const { aiEndpoint, aiApiKey, aiModel } = this.settings;
    if (!aiEndpoint || !aiApiKey) {
      this.fellBack = true;
      return null;
    }
    const optionsHint = opts.options?.length
      ? ` The answer must be one of: ${opts.options.join(', ')}.`
      : '';
    const prompt =
      `You are interviewing a client about their website project.\n` +
      `Question: "${question}"\n` +
      `Client's answer: "${answer}"\n` +
      `Extract the key structured value from the answer.${optionsHint}\n` +
      `Reply ONLY with JSON, no markdown: {"value": <string|boolean>, "confidence": "high"|"medium"|"low"}`;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${aiEndpoint.replace(/\/+$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${aiApiKey}`,
        },
        body: JSON.stringify({
          model: aiModel || 'gpt-4o-mini',
          temperature: 0,
          max_tokens: 90,
          messages: [
            {
              role: 'system',
              content:
                'You extract structured values from client answers. Never invent information: if the answer does not contain the value, reply {"value": null, "confidence": "low"}.',
            },
            { role: 'user', content: prompt },
          ],
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) {
        this.fellBack = true;
        return null;
      }
      const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const content = data.choices?.[0]?.message?.content?.trim();
      if (!content) {
        this.fellBack = true;
        return null;
      }
      const jsonText = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      const parsed = JSON.parse(jsonText) as {
        value?: string | boolean | null;
        confidence?: string;
      };
      if (parsed.value === null || parsed.value === undefined) return null;
      const confidence = parsed.confidence === 'high' || parsed.confidence === 'medium' ? parsed.confidence : 'low';
      return { field: opts.field, value: parsed.value, confidence };
    } catch {
      this.fellBack = true;
      return null;
    }
  }
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Maps generation context onto an AIContext with empty section fields. */
function emptyAIContext(ctx: GenerationContext): AIContext {
  return {
    business: ctx.business,
    industry: ctx.industry,
    description: '',
    projectGoal: ctx.projectGoal,
    targetAudience: ctx.targetAudience,
    theme: ctx.theme,
    pageLabel: '',
    sectionType: 'hero',
    sectionTitle: '',
    sectionSubtitle: '',
  };
}

/* ------------------------------------------------------------------ */
/* Factory                                                             */
/* ------------------------------------------------------------------ */

export function getAIProvider(settings: Settings): AIProvider {
  if (settings.aiProvider === 'custom') {
    return new CustomAIProvider(settings);
  }
  return new LocalAIProvider();
}