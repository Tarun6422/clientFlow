import type {
  PrototypeDesign,
  PrototypeItem,
  PrototypeSection,
  PrototypeSectionType,
  ThemePalette,
} from '../types';
import { getPalette } from '../themes/palettes';
import { getTypeQuestions } from './typeQuestions';
import { uid } from './utils';

/* ------------------------------------------------------------------ */
/* Grounded copy helpers — only use facts the client actually gave us. */
/* ------------------------------------------------------------------ */

export interface SectionContext {
  business: string;
  industry: string;
  description: string;
  projectGoal: string;
  targetAudience: string;
  features: string[];
  notes: string;
  theme: string;
  pageLabel: string;
  /** Website type (e.g. "E-commerce") — enables dynamic-answer awareness. */
  websiteType?: string;
  /** Website-type question answers, used only to ground generated content. */
  dynamicAnswers?: Record<string, string | string[] | boolean> | null;
}

export const NOT_PROVIDED = 'Not provided';

function firstSentence(text: string, fallback: string): string {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return fallback;
  const idx = clean.search(/[.!?](?:\s|$)/);
  return idx > -1 ? clean.slice(0, idx + 1) : clean;
}

function lowerFirst(s: string): string {
  if (!s) return s;
  return s.charAt(0).toLowerCase() + s.slice(1);
}

function items(seed: string, count: number, fn: (i: number) => PrototypeItem): PrototypeItem[] {
  return Array.from({ length: count }).map((_, i) => {
    const base = fn(i);
    return { id: `${seed}-${i}`, ...base };
  });
}

/* ------------------------------------------------------------------ */
/* Section templates per type                                          */
/* ------------------------------------------------------------------ */

export const SECTION_TYPE_LABELS: Record<PrototypeSectionType, string> = {
  hero: 'Hero',
  features: 'Features',
  services: 'Services',
  products: 'Products',
  testimonials: 'Testimonials',
  cta: 'Call to Action',
  stats: 'Stats',
  gallery: 'Gallery',
  logos: 'Logo Strip',
  contact: 'Contact',
  faq: 'FAQ',
  team: 'Team',
  pricing: 'Pricing',
  blog: 'Blog / News',
  cards: 'Cards',
  text: 'Text Block',
};

export const SECTION_TYPE_ORDER: PrototypeSectionType[] = [
  'hero',
  'features',
  'services',
  'products',
  'testimonials',
  'cta',
  'stats',
  'gallery',
  'logos',
  'contact',
  'faq',
  'team',
  'pricing',
  'blog',
  'cards',
  'text',
];

const PLACEHOLDER_NOTE = 'Placeholder copy — replace with real content.';

function buildSection(
  type: PrototypeSectionType,
  fields: Omit<PrototypeSection, 'id' | 'type' | 'items'> & { items?: PrototypeItem[] }
): PrototypeSection {
  return {
    id: uid(),
    type,
    title: fields.title || SECTION_TYPE_LABELS[type],
    subtitle: fields.subtitle,
    items: fields.items ?? [],
    cta: fields.cta,
    image: fields.image,
    align: fields.align,
    purpose: fields.purpose,
    contentDirection: fields.contentDirection,
    visualDirection: fields.visualDirection,
  };
}

/** Creates a starter section for a type, grounded in the client's data. */
export function createSection(type: PrototypeSectionType, ctx: SectionContext): PrototypeSection {
  const business = ctx.business || 'our business';
  switch (type) {
    case 'hero':
      return buildSection('hero', {
        title: ctx.business || 'Welcome',
        subtitle:
          ctx.description
            ? firstSentence(ctx.description, '')
            : ctx.projectGoal
              ? firstSentence(ctx.projectGoal, '')
              : `${NOT_PROVIDED} — add a short introduction to ${business}.`,
        cta: { label: 'Get in touch' },
        image: 'Hero image',
        align: 'center',
      });
    case 'features':
      return buildSection('features', {
        title: 'What we offer',
        subtitle: ctx.features.length
          ? `The features the client asked for: ${ctx.features.slice(0, 5).join(', ')}.`
          : `${NOT_PROVIDED} — describe the key features of this offer.`,
        items: (() => {
          // Merge the client's feature list with confirmed website-type answers
          // (e.g. "Shopping cart", "Table reservation") — grounded, never invented.
          const dynamic = dynamicTrueLabels(ctx);
          const merged: string[] = [];
          ctx.features.forEach((f) => {
            if (!merged.includes(f)) merged.push(f);
          });
          dynamic.forEach((d) => {
            if (!merged.includes(d)) merged.push(d);
          });
          const list = merged.slice(0, 6);
          if (list.length === 0) {
            return items('feat', 3, (i) => ({
              title: `Feature ${i + 1}`,
              description: `Describe this feature. ${PLACEHOLDER_NOTE}`,
            }));
          }
          return list.map((f, i) => ({
            id: `feat-${i}`,
            title: f,
            description: `This is the "${f}" feature. Replace this line with a short, factual description.`,
          }));
        })(),
      });
    case 'services':
      return buildSection('services', {
        title: 'Our services',
        subtitle: ctx.industry
          ? `Serving the ${ctx.industry.toLowerCase()} space with care and attention to detail.`
          : `${NOT_PROVIDED} — list the services you offer.`,
        items: items('svc', 3, (i) => ({
          title: `Service ${i + 1}`,
          description: `Describe this service. ${PLACEHOLDER_NOTE}`,
          image: `Service image ${i + 1}`,
        })),
      });
    case 'products':
      return buildSection('products', {
        title: 'Our products',
        subtitle: productCountNote(ctx) ||
          'Browse a selection of what we offer. Replace these placeholders with real products, photography and descriptions.',
        items: items('prod', 6, (i) => ({
          title: `Product ${i + 1}`,
          description: 'Short description. Replace with real product copy.',
          image: `Product image ${i + 1}`,
          cta: 'Enquire',
        })),
      });
    case 'testimonials':
      return buildSection('testimonials', {
        title: 'What clients say',
        subtitle: 'Replace these placeholders with real reviews from your clients.',
        items: items('tst', 3, (i) => ({
          title: 'Client name',
          meta: 'Role or company',
          description: `“Add the client's testimonial here. ${PLACEHOLDER_NOTE}”`,
        })),
      });
    case 'cta':
      return buildSection('cta', {
        title: 'Ready to get started?',
        subtitle: ctx.projectGoal
          ? firstSentence(ctx.projectGoal, '')
          : `${NOT_PROVIDED} — what should visitors do next?`,
        cta: { label: 'Get in touch' },
        align: 'center',
      });
    case 'stats':
      return buildSection('stats', {
        title: 'Results that matter',
        subtitle: 'Add real figures from the business. No invented numbers are used.',
        items: items('stat', 3, (i) => ({
          title: '—',
          meta: `Statistic ${i + 1}`,
          description: `Add a real figure and label. ${PLACEHOLDER_NOTE}`,
        })),
      });
    case 'gallery':
      return buildSection('gallery', {
        title: 'Gallery',
        subtitle: 'Replace these placeholders with real photos.',
        items: items('gal', 6, (i) => ({
          title: `Photo ${i + 1}`,
          description: '',
          image: `Image ${i + 1}`,
        })),
      });
    case 'logos':
      return buildSection('logos', {
        title: 'Trusted by',
        subtitle: 'Replace these placeholders with the names of real partners or clients.',
        items: items('logo', 5, (i) => ({
          title: 'LOGO',
          description: '',
        })),
      });
    case 'contact':
      return buildSection('contact', {
        title: 'Contact us',
        subtitle: 'Send us a message and we will get back to you shortly.',
        cta: { label: 'Send message' },
      });
    case 'faq':
      return buildSection('faq', {
        title: 'Frequently asked questions',
        subtitle: 'Add the questions your customers ask most.',
        items: items('faq', 3, (i) => ({
          title: `Question ${i + 1}`,
          description: `Answer the question here. ${PLACEHOLDER_NOTE}`,
        })),
      });
    case 'team':
      return buildSection('team', {
        title: 'Meet the team',
        subtitle: 'Add your team members with real names and roles.',
        items: items('team', 3, (i) => ({
          title: 'Team member',
          meta: 'Role',
          description: 'Short bio. Replace with real details.',
          image: `Portrait ${i + 1}`,
        })),
      });
    case 'pricing':
      return buildSection('pricing', {
        title: 'Pricing',
        subtitle: 'No prices are invented — replace these placeholders with the real offer.',
        items: Array.from({ length: 3 }).map((_, i) => ({
          id: `price-${i}`,
          title: `Plan ${i + 1}`,
          meta: 'Contact for pricing',
          description: 'Describe what is included in this option.',
          cta: 'Enquire',
        })),
      });
    case 'blog':
      return buildSection('blog', {
        title: 'Latest updates',
        subtitle: 'Share news, guides and announcements from the business.',
        items: items('post', 3, (i) => ({
          title: `Article title ${i + 1}`,
          meta: 'Category · Date',
          description: 'Short excerpt of the article. Replace with real content.',
          image: `Article image ${i + 1}`,
          cta: 'Read more',
        })),
      });
    case 'cards':
      return buildSection('cards', {
        title: 'Highlights',
        subtitle: 'A flexible grid of cards — add or edit the cards below.',
        items: items('card', 3, (i) => ({
          title: `Card ${i + 1}`,
          description: `Describe this card. ${PLACEHOLDER_NOTE}`,
          image: `Card image ${i + 1}`,
        })),
      });
    case 'text':
      return buildSection('text', {
        title: ctx.business || 'About',
        subtitle:
          ctx.description ||
          `${NOT_PROVIDED} — write a short introduction to ${business}.`,
        align: 'left',
      });
  }
}

/* ------------------------------------------------------------------ */
/* Design defaults per theme                                           */
/* ------------------------------------------------------------------ */

const THEME_DESIGN_DEFAULTS: Record<string, Partial<Omit<PrototypeDesign, 'theme' | 'colors'>>> = {
  'modern-minimal': { radius: 18, font: 'sans', buttons: 'solid', spacing: 'comfortable' },
  'bento-saas': { radius: 16, font: 'sans', buttons: 'solid', spacing: 'comfortable' },
  'dark-premium': { radius: 14, font: 'display', buttons: 'pill', spacing: 'comfortable' },
  'aurora-glass': { radius: 22, font: 'sans', buttons: 'pill', spacing: 'comfortable' },
  'neo-brutalist': { radius: 4, font: 'display', buttons: 'solid', spacing: 'spacious' },
  editorial: { radius: 2, font: 'serif', buttons: 'outline', spacing: 'spacious' },
};

export function defaultDesign(themeId: string): PrototypeDesign {
  const palette: ThemePalette = { ...getPalette(themeId) };
  return {
    theme: themeId,
    colors: palette,
    ...(THEME_DESIGN_DEFAULTS[themeId] ?? {}),
  } as PrototypeDesign;
}

/** Applies a theme change while keeping user tweaks that still make sense. */
export function applyThemeChange(design: PrototypeDesign, themeId: string): PrototypeDesign {
  const defaults = THEME_DESIGN_DEFAULTS[themeId] ?? {};
  return {
    ...design,
    theme: themeId,
    colors: { ...getPalette(themeId) },
    ...defaults,
  };
}

export function newPage(label: string): { id: string; label: string } {
  return { id: uid(), label };
}

export function uidItem(): string {
  return uid();
}

/* ------------------------------------------------------------------ */
/* Dynamic-answer helpers (grounded only — never invented)             */
/* ------------------------------------------------------------------ */

/** Labels of website-type questions answered "Yes" (e.g. "Shopping cart"). */
function dynamicTrueLabels(ctx: SectionContext): string[] {
  if (!ctx.websiteType || !ctx.dynamicAnswers) return [];
  return getTypeQuestions(ctx.websiteType)
    .filter((q) => q.kind === 'yesno' && ctx.dynamicAnswers?.[q.id] === true)
    .map((q) => q.label.replace(/\?$/, ''));
}

/** "Approximately N products" note when the client provided a product count. */
function productCountNote(ctx: SectionContext): string {
  const count = ctx.dynamicAnswers?.['ecom-product-count'];
  if (typeof count === 'string' && count.trim()) {
    return `Showcase the catalogue (approximately ${count.trim()} products). Replace these placeholders with real products and photography.`;
  }
  return '';
}