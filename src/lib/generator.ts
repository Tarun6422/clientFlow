import type {
  AiAnalysis,
  AiAnalysisField,
  BlueprintSection,
  Client,
  ClientStatus,
  PageBlueprint,
  PrototypePage,
  PrototypeSection,
  PrototypeSectionType,
  PrototypeSnapshot,
  PrototypeVersion,
  SitemapPage,
} from '../types';
import { uid } from './utils';
import { getTheme } from '../themes';
import { createSection, defaultDesign, NOT_PROVIDED, type SectionContext } from './prototypeSections';
import { dynamicTrueLabels, summarizeDynamicAnswers } from './typeQuestions';

/* ------------------------------------------------------------------ */
/* Requirement analysis — structures the collected answers into a      */
/* project specification. Never invents facts: unknown → "Not provided" */
/* ------------------------------------------------------------------ */

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

function themeName(id: string): string {
  return getTheme(id)?.name ?? NOT_PROVIDED;
}

export function analyzeClient(client: Client): AiAnalysis {
  const allPages = [...client.pages, ...client.customPages];
  const allFeatures = [...client.features, ...client.customFeatures];

  const field = (label: string, value: string): AiAnalysisField => {
    const v = (value || '').trim();
    return { label, value: v || NOT_PROVIDED, missing: !v };
  };

  const dynamicSummary = summarizeDynamicAnswers(client.dynamicAnswers, client.projectType);

  const fields: AiAnalysisField[] = [
    field('Client name', client.name),
    field('Company / Business', client.businessName || client.company),
    field('Industry', client.industry),
    field('Website type', client.projectType),
    field('Project goal', client.projectGoal),
    field('Target audience', client.targetAudience),
    field('Budget', client.budget),
    field('Deadline', client.deadline ? new Date(client.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''),
    field('Required pages', allPages.join(', ')),
    field('Required features', allFeatures.join(', ')),
    field('Website type requirements', dynamicSummary),
    field('Selected theme', themeName(client.theme)),
    field('Additional requirements', client.notes),
  ];

  const missing = fields.filter((f) => f.missing).map((f) => f.label);

  const business = client.businessName || client.company || client.name || NOT_PROVIDED;

  const summaryParts: string[] = [];
  summaryParts.push(
    `${business}${client.industry ? ` (${client.industry})` : ''} needs a ${client.projectType || 'website'}${client.projectGoal ? ` focused on ${lowerFirst(firstSentence(client.projectGoal, 'delivering results'))}` : ''}.`
  );
  if (client.targetAudience) {
    summaryParts.push(`Built for ${lowerFirst(firstSentence(client.targetAudience, 'its audience'))}`);
  }
  if (client.budget) summaryParts.push(`Budget: ${client.budget}.`);
  if (client.deadline) {
    summaryParts.push(
      `Deadline: ${new Date(client.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}.`
    );
  }
  if (allPages.length) summaryParts.push(`Planned pages: ${allPages.slice(0, 6).join(', ')}${allPages.length > 6 ? ' and more' : ''}.`);
  if (allFeatures.length) summaryParts.push(`Key features: ${allFeatures.slice(0, 5).join(', ')}${allFeatures.length > 5 ? ' and more' : ''}.`);
  if (dynamicSummary) summaryParts.push(`Website type requirements: ${dynamicSummary}.`);
  if (client.theme) summaryParts.push(`Design direction: ${themeName(client.theme)}.`);
  if (missing.length) {
    summaryParts.push(
      `Missing information (${missing.length}): ${missing.join(', ')} — these are marked “${NOT_PROVIDED}” and can be added later.`
    );
  }

  /* Suggestions are derived from what the client asked for — never invented. */
  const suggestions: string[] = [];
  const isEcommerce =
    client.projectType === 'E-commerce' ||
    allFeatures.some((f) => ['Shopping Cart', 'Payment Gateway', 'Wishlist'].includes(f));
  if (isEcommerce && !allPages.some((p) => /cart|checkout|shop/i.test(p))) {
    suggestions.push('E-commerce features were requested — consider adding Shop, Cart and Checkout pages to the sitemap.');
  }
  if (allFeatures.some((f) => /booking|appointment/i.test(f)) && !allPages.some((p) => /book|reserve/i.test(p))) {
    suggestions.push('A booking/appointment feature was requested — a dedicated booking page would help convert visitors.');
  }
  if (client.targetAudience && !allPages.some((p) => /faq|testimonial/i.test(p))) {
    suggestions.push('Add an FAQ or Testimonials page to address the target audience’s likely questions early.');
  }
  if (missing.includes('Project goal') || missing.includes('Target audience')) {
    suggestions.push('A clear project goal and target audience sharpen the design — collect these from the client when possible.');
  }
  if (client.notes) {
    suggestions.push(`Additional requirements noted: ${lowerFirst(firstSentence(client.notes, ''))}`);
  }
  const dyn = client.dynamicAnswers ?? {};
  const dynTrue = dynamicTrueLabels(client);
  if (client.projectType === 'Restaurant' && (dyn['rest-online-ordering'] === true || dyn['rest-table-reservation'] === true) && !allPages.some((p) => /reserv|order/i.test(p))) {
    suggestions.push('Online ordering or reservations were requested — a dedicated Reservations/Order page would help convert visitors.');
  }
  if (client.projectType === 'Real Estate' && dyn['re-inquiry'] === true && !allPages.some((p) => /contact|inquir/i.test(p))) {
    suggestions.push('An inquiry flow was requested — make sure the Contact page collects property enquiries.');
  }
  if (client.projectType === 'Portfolio' && dyn['port-projects'] === true && !allPages.some((p) => /portfolio|work|project/i.test(p))) {
    suggestions.push('Portfolio projects were requested — consider adding a Work/Portfolio page to the sitemap.');
  }
  if (dynTrue.length > 0) {
    suggestions.push(`Confirmed website-type requirements: ${dynTrue.join(', ')} — these will shape the generated prototype sections.`);
  }
  if (suggestions.length === 0) {
    suggestions.push('The requirements are complete enough to generate a first prototype.');
  }

  return {
    generatedAt: Date.now(),
    clientName: client.name || NOT_PROVIDED,
    business,
    websiteType: client.projectType || NOT_PROVIDED,
    summary: summaryParts.join(' '),
    fields,
    missing,
    suggestions,
  };
}

/* ------------------------------------------------------------------ */
/* Smart sitemap generator                                             */
/* ------------------------------------------------------------------ */

export function generateSitemap(client: Client): SitemapPage[] {
  const allPages = [...client.pages, ...client.customPages]
    .map((p) => p.trim())
    .filter(Boolean);
  const dyn = client.dynamicAnswers ?? {};
  const isEcommerce =
    client.projectType === 'E-commerce' ||
    [...client.features, ...client.customFeatures].some((f) =>
      ['Shopping Cart', 'Payment Gateway', 'Wishlist', 'User Registration'].includes(f)
    ) ||
    dyn['ecom-cart'] === true ||
    dyn['ecom-wishlist'] === true ||
    dyn['ecom-payment'] === true;

  let seed: string[] =
    allPages.length > 0
      ? allPages
      : isEcommerce
        ? ['Home', 'Shop', 'Cart', 'Checkout', 'Account', 'About', 'Contact']
        : ['Home', 'About', 'Services', 'Contact'];

  if (isEcommerce) {
    const has = (name: string) => seed.some((p) => p.toLowerCase() === name.toLowerCase());
    if (!has('Shop')) seed.push('Shop');
    if (!has('Cart')) seed.push('Cart');
    if (!has('Checkout')) seed.push('Checkout');
    if (!has('Account')) seed.push('Account');
  }

  /* Website-type dynamic answers add the pages the client actually needs. */
  const ensurePage = (name: string) => {
    if (!seed.some((p) => p.toLowerCase() === name.toLowerCase())) seed.push(name);
  };
  if (client.projectType === 'Restaurant') {
    if (dyn['rest-online-ordering'] === true) ensurePage('Order Online');
    if (dyn['rest-table-reservation'] === true || dyn['rest-reservation-system'] === true) ensurePage('Reservations');
  }
  if (client.projectType === 'Real Estate' && dyn['re-listings'] === true) {
    ensurePage('Properties');
  }
  if (client.projectType === 'Portfolio' && dyn['port-projects'] === true) {
    ensurePage('Portfolio');
  }
  if (client.projectType === 'Blog' && Object.values(dyn).some((v) => v === true)) {
    ensurePage('Blog');
  }
  if (client.projectType === 'SaaS' && dyn['saas-plans'] === true) {
    ensurePage('Pricing');
  }
  if (client.projectType === 'Business Website' && dyn['bw-blog'] === true) {
    ensurePage('Blog');
  }

  // Dedupe case-insensitively, Home first, Contact always present.
  const seen = new Set<string>();
  const ordered: SitemapPage[] = [];
  const push = (label: string) => {
    const key = label.trim().toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    ordered.push({ id: uid(), label: label.trim() });
  };

  const home = seed.find((p) => p.toLowerCase() === 'home') ?? 'Home';
  push(home);
  seed.forEach((p) => {
    if (p.toLowerCase() !== 'home') push(p);
  });
  if (!seen.has('contact')) push('Contact');

  return ordered;
}

/* ------------------------------------------------------------------ */
/* Page blueprints — section plans per sitemap page                    */
/* ------------------------------------------------------------------ */

const THEME_VISUAL: Record<string, string> = {
  'modern-minimal': 'Clean white layout, generous whitespace and soft rounded cards with premium typography.',
  'bento-saas': 'Bento-grid cards with blue/violet gradients, bold headings and a tech/SaaS feel.',
  'dark-premium': 'Dark charcoal background, large bold type, glowing accent colours and a premium feel.',
  'aurora-glass': 'Glassmorphism panels floating over blurred blue/purple/pink aurora gradients.',
  'neo-brutalist': 'Thick borders, hard offset shadows, high-contrast bright colours and uppercase type.',
  editorial: 'Magazine-inspired editorial layout with serif typography and image-led storytelling.',
};

const SECTION_PURPOSE: Record<string, string> = {
  Hero: 'Introduce the page and capture attention in the first screenful.',
  'Trust indicators': 'Build credibility with partner logos, badges or quick stats.',
  Services: 'Present the services on offer so visitors can self-select.',
  'Featured products': 'Showcase key products with imagery and a call to action.',
  Testimonials: 'Build trust with real social proof from past clients.',
  CTA: 'Convert visitors with a clear, single next step.',
  Story: 'Tell the story of the business and why it exists.',
  'Mission & values': 'Explain what the business stands for.',
  Team: 'Humanise the business with real faces, names and roles.',
  Process: 'Walk visitors through how the business works.',
  'Product grid': 'Display the catalogue with clean cards and filters.',
  Features: 'Highlight the key capabilities and benefits.',
  Work: 'Show the portfolio with strong visuals.',
  Contact: 'Collect enquiries with a clear form and contact details.',
  FAQ: 'Answer common questions and reduce friction.',
  Articles: 'Publish updates, guides and announcements.',
  Newsletter: 'Capture emails and keep the audience engaged.',
  Pricing: 'Present the offer with transparent options.',
  Gallery: 'Show the space, work or products visually.',
  'Cart overview': 'Summarise the items the visitor is about to buy.',
  'Checkout CTA': 'Move the visitor to complete the purchase.',
  'Trust badges': 'Reassure the visitor with security and delivery notes.',
  Checkout: 'Collect order details and payment information.',
  Account: 'Let customers sign in and manage their details.',
  Text: 'Explain the topic in detail with well-structured copy.',
};

interface BlueprintPlan {
  sections: string[];
}

const PAGE_PLANS: Record<string, BlueprintPlan> = {
  home: { sections: ['Hero', 'Trust indicators', 'Services', 'Featured products', 'Testimonials', 'CTA'] },
  about: { sections: ['Hero', 'Story', 'Mission & values', 'Team', 'CTA'] },
  services: { sections: ['Hero', 'Services', 'Process', 'Testimonials', 'CTA'] },
  products: { sections: ['Hero', 'Product grid', 'Features', 'CTA'] },
  shop: { sections: ['Hero', 'Product grid', 'Features', 'CTA'] },
  portfolio: { sections: ['Hero', 'Work', 'Testimonials', 'CTA'] },
  work: { sections: ['Hero', 'Work', 'Testimonials', 'CTA'] },
  testimonials: { sections: ['Hero', 'Testimonials', 'CTA'] },
  reviews: { sections: ['Hero', 'Testimonials', 'CTA'] },
  contact: { sections: ['Hero', 'Contact', 'FAQ'] },
  faq: { sections: ['Hero', 'FAQ', 'CTA'] },
  blog: { sections: ['Hero', 'Articles', 'Newsletter'] },
  news: { sections: ['Hero', 'Articles', 'Newsletter'] },
  pricing: { sections: ['Hero', 'Pricing', 'FAQ', 'CTA'] },
  team: { sections: ['Hero', 'Team', 'CTA'] },
  gallery: { sections: ['Hero', 'Gallery', 'CTA'] },
  cart: { sections: ['Hero', 'Cart overview', 'Checkout CTA', 'Trust badges'] },
  checkout: { sections: ['Hero', 'Checkout', 'Trust badges'] },
  account: { sections: ['Hero', 'Account', 'Trust badges'] },
  login: { sections: ['Hero', 'Account'] },
  'privacy policy': { sections: ['Text'] },
  'terms & conditions': { sections: ['Text'] },
  default: { sections: ['Hero', 'Text', 'CTA'] },
};

function planForPage(label: string): BlueprintPlan {
  const key = label.trim().toLowerCase();
  return PAGE_PLANS[key] ?? PAGE_PLANS.default;
}

function ctaFor(name: string, client: Client): string {
  const n = name.toLowerCase();
  if (/checkout/.test(n)) return 'Proceed to checkout';
  if (/newsletter/.test(n)) return 'Subscribe';
  if (/contact|account|login/.test(n)) return 'Send message';
  if (/cart/.test(n)) return 'View cart';
  if (/pricing|plan/.test(n)) return 'Choose a plan';
  if (/faq/.test(n)) return 'Contact support';
  if (/product|shop|gallery|work/.test(n)) return 'Explore';
  return client.projectGoal ? 'Get in touch' : 'Learn more';
}

function contentDirectionFor(name: string, client: Client): string {
  const n = name.toLowerCase();
  const business = client.businessName || client.company || client.name || NOT_PROVIDED;
  const features = [...client.features, ...client.customFeatures];

  if (/hero|banner|intro/.test(n)) {
    return client.description
      ? `Open with what ${business} does: “${firstSentence(client.description, '')}”.`
      : `${NOT_PROVIDED} — write an introduction to ${business}.`;
  }
  if (/service/.test(n)) {
    const dyn = dynamicTrueLabels(client);
    const list = [...features, ...dyn].slice(0, 6);
    return list.length
      ? `Present what the client asked for: ${list.join(', ')}.`
      : `${NOT_PROVIDED} — list the services ${business} offers.`;
  }
  if (/product/.test(n)) {
    return client.industry
      ? `Showcase ${business}'s ${lowerFirst(client.industry)} offerings with strong imagery.`
      : `Showcase the products of ${business}. Product details: ${NOT_PROVIDED}.`;
  }
  if (/testimonial/.test(n)) {
    return `${NOT_PROVIDED} — collect real client testimonials from ${business}.`;
  }
  if (/cta|newsletter|checkout/.test(n)) {
    return client.projectGoal
      ? `Drive visitors toward: ${lowerFirst(firstSentence(client.projectGoal, 'the next step'))}.`
      : `${NOT_PROVIDED} — define the primary conversion goal.`;
  }
  if (/faq/.test(n)) {
    return client.notes
      ? `Address what the client noted: ${firstSentence(client.notes, '')}`
      : `${NOT_PROVIDED} — gather the questions clients ask most.`;
  }
  if (/contact|account|login/.test(n)) {
    return `Make it easy for ${client.targetAudience || NOT_PROVIDED} to reach ${business}.`;
  }
  if (/team/.test(n)) {
    return `${NOT_PROVIDED} — collect team member names, roles and bios.`;
  }
  if (/price|plan/.test(n)) {
    return `Use the client's real pricing. Budget provided: ${client.budget || NOT_PROVIDED}.`;
  }
  if (/blog|article/.test(n)) {
    return `Share updates from ${business}. Content source: ${client.contentProvider || NOT_PROVIDED}.`;
  }
  if (/gallery|work|photo/.test(n)) {
    return `Showcase the visual work of ${business}. Imagery: ${NOT_PROVIDED}.`;
  }
  if (/story|mission|process|values|text|cart|trust/.test(n)) {
    return client.description
      ? `Expand on: “${firstSentence(client.description, '')}”`
      : `${NOT_PROVIDED} — describe ${business} here.`;
  }
  return `Tailor this section to ${client.industry ? `the ${lowerFirst(client.industry)} context of ` : ''}${business}.`;
}

export function generateBlueprints(client: Client, sitemap: SitemapPage[]): PageBlueprint[] {
  return sitemap.map((page) => {
    const plan = planForPage(page.label);
    const sections: BlueprintSection[] = plan.sections.map((name) => ({
      name,
      purpose: SECTION_PURPOSE[name] ?? `Support the goal of the ${page.label} page.`,
      contentDirection: contentDirectionFor(name, client),
      cta: ctaFor(name, client),
      visualDirection: client.theme
        ? THEME_VISUAL[client.theme] ?? 'Clean, professional and consistent with the selected design system.'
        : `Follow the selected theme. ${NOT_PROVIDED} — choose one of the six design directions.`,
    }));
    return { pageId: page.id, pageName: page.label, sections };
  });
}

/* ------------------------------------------------------------------ */
/* Blueprint → editable prototype                                      */
/* ------------------------------------------------------------------ */

const GENERIC_SECTION_LABELS = new Set(['Hero', 'CTA']);

const BLUEPRINT_TYPE_MAP: Array<[RegExp, PrototypeSectionType | null]> = [
  [/hero|banner|intro/i, 'hero'],
  [/testimonial/i, 'testimonials'],
  [/trust|logo|badge/i, 'logos'],
  [/feature/i, 'features'],
  [/service/i, 'services'],
  [/product|shop|grid|collection/i, 'products'],
  [/pricing|plan/i, 'pricing'],
  [/faq/i, 'faq'],
  [/checkout|account|login|contact|form/i, 'contact'],
  [/cta|newsletter/i, 'cta'],
  [/gallery|work|photo/i, 'gallery'],
  [/team/i, 'team'],
  [/blog|article/i, 'blog'],
  [/cart|summary/i, 'cards'],
  [/story|mission|process|values|text/i, 'text'],
  [/stat|number|metric/i, 'stats'],
  [/card|highlight/i, 'cards'],
  [/navigation|footer|menu/i, null],
];

export function mapBlueprintToType(name: string): PrototypeSectionType | null {
  for (const [re, type] of BLUEPRINT_TYPE_MAP) {
    if (re.test(name)) return type;
  }
  return 'text';
}

export function buildPrototype(
  client: Client,
  sitemap: SitemapPage[],
  blueprints: PageBlueprint[],
  themeId: string
): PrototypeSnapshot {
  const ctx: SectionContext = {
    business: client.businessName || client.company || client.name || '',
    industry: client.industry,
    description: client.description,
    projectGoal: client.projectGoal,
    targetAudience: client.targetAudience,
    features: [...client.features, ...client.customFeatures],
    notes: client.notes,
    theme: themeId,
    pageLabel: 'Home',
    websiteType: client.projectType,
    dynamicAnswers: client.dynamicAnswers ?? null,
  };

  const pages: PrototypePage[] = sitemap.map((page) => {
    const blueprint = blueprints.find((b) => b.pageId === page.id);
    ctx.pageLabel = page.label;
    const sections: PrototypeSection[] = [];
    if (blueprint) {
      blueprint.sections.forEach((bs) => {
        const type = mapBlueprintToType(bs.name);
        if (!type) return; // navigation / footer are rendered automatically
        const section = createSection(type, ctx);
        // Keep the template's natural heading for generic labels like “Hero” / “CTA”.
        section.title = GENERIC_SECTION_LABELS.has(bs.name) ? section.title : bs.name;
        section.purpose = bs.purpose;
        section.contentDirection = bs.contentDirection;
        section.visualDirection = bs.visualDirection;
        if (bs.cta && bs.cta !== NOT_PROVIDED) {
          section.cta = { label: bs.cta };
        }
        sections.push(section);
      });
    } else {
      sections.push(createSection(page.label === 'Home' ? 'hero' : 'text', ctx));
      sections.push(createSection('cta', ctx));
    }
    return { id: page.id, label: page.label, sections };
  });

  return { pages, design: defaultDesign(themeId || client.theme || 'modern-minimal') };
}

/* ------------------------------------------------------------------ */
/* Versions                                                            */
/* ------------------------------------------------------------------ */

export function cloneSnapshot(snapshot: PrototypeSnapshot): PrototypeSnapshot {
  return JSON.parse(JSON.stringify(snapshot)) as PrototypeSnapshot;
}

export function nextVersionNumber(versions: PrototypeVersion[] | undefined): number {
  return (versions ?? []).reduce((max, v) => Math.max(max, v.number), 0) + 1;
}

export function createVersion(
  snapshot: PrototypeSnapshot,
  status: PrototypeVersion['status'],
  note?: string
): PrototypeVersion {
  return {
    number: 1, // caller overwrites with nextVersionNumber when appending
    date: Date.now(),
    status,
    note,
    data: cloneSnapshot(snapshot),
  };
}

/** Status a newly saved version should carry, derived from the live project status. */
export function versionStatusFor(status: ClientStatus): PrototypeVersion['status'] {
  if (status === 'Prototype Approved') return 'Prototype Approved';
  if (status === 'Changes Requested') return 'Changes Requested';
  return 'Draft';
}