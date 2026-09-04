import type { Client } from '../types';

/* ------------------------------------------------------------------ */
/* Website-type specific questions (dynamic wizard questions)          */
/* ------------------------------------------------------------------ */
/* Each website type can have its own contextual questionnaire. Answers */
/* are stored flat on the client as `dynamicAnswers[questionId]`:       */
/*   yesno  → boolean                                                   */
/*   multi  → string[]                                                  */
/*   text/number/textarea → string                                      */
/* All fields are optional on the Client, so older records load fine.   */

export type QuestionKind = 'yesno' | 'multi' | 'text' | 'number' | 'textarea';

export interface TypeQuestion {
  id: string;
  label: string;
  kind: QuestionKind;
  options?: string[];
  hint?: string;
  placeholder?: string;
}

export type DynamicAnswer = string | string[] | boolean;

export type DynamicAnswers = Record<string, DynamicAnswer>;

export const TYPE_QUESTIONS: Record<string, TypeQuestion[]> = {
  'E-commerce': [
    { id: 'ecom-categories', label: 'Do you need product categories?', kind: 'yesno' },
    { id: 'ecom-product-count', label: 'Approximate number of products?', kind: 'number', placeholder: 'e.g. 50–100' },
    { id: 'ecom-variants', label: 'Product variants (size, colour…)?', kind: 'yesno' },
    { id: 'ecom-cart', label: 'Shopping cart?', kind: 'yesno' },
    { id: 'ecom-wishlist', label: 'Wishlist?', kind: 'yesno' },
    { id: 'ecom-accounts', label: 'Customer accounts?', kind: 'yesno' },
    { id: 'ecom-guest-checkout', label: 'Guest checkout?', kind: 'yesno' },
    { id: 'ecom-payment', label: 'Payment gateway?', kind: 'yesno' },
    { id: 'ecom-shipping', label: 'Shipping / delivery?', kind: 'yesno' },
    { id: 'ecom-order-tracking', label: 'Order tracking?', kind: 'yesno' },
    { id: 'ecom-coupons', label: 'Coupon / discount system?', kind: 'yesno' },
    { id: 'ecom-inventory', label: 'Inventory management?', kind: 'yesno' },
    { id: 'ecom-reviews', label: 'Product reviews?', kind: 'yesno' },
    {
      id: 'ecom-payment-providers',
      label: 'Which payment providers?',
      kind: 'multi',
      options: ['Razorpay', 'PayU', 'Stripe', 'PayPal', 'Cash on Delivery', 'UPI', 'Other'],
    },
    {
      id: 'ecom-shipping-providers',
      label: 'Which shipping providers?',
      kind: 'multi',
      options: ['Shiprocket', 'Delhivery', 'BlueDart', 'DTDC', 'India Post', 'Other'],
    },
  ],
  Restaurant: [
    { id: 'rest-menu', label: 'Menu required?', kind: 'yesno' },
    { id: 'rest-online-ordering', label: 'Online ordering?', kind: 'yesno' },
    { id: 'rest-table-reservation', label: 'Table reservation?', kind: 'yesno' },
    { id: 'rest-reservation-system', label: 'Reservation system?', kind: 'yesno' },
    { id: 'rest-map', label: 'Location / map?', kind: 'yesno' },
    { id: 'rest-hours', label: 'Opening hours?', kind: 'yesno' },
    { id: 'rest-gallery', label: 'Food gallery?', kind: 'yesno' },
    { id: 'rest-whatsapp', label: 'WhatsApp ordering?', kind: 'yesno' },
    { id: 'rest-delivery', label: 'Delivery?', kind: 'yesno' },
    { id: 'rest-pickup', label: 'Pickup?', kind: 'yesno' },
    { id: 'rest-branches', label: 'Multiple branches?', kind: 'yesno' },
    { id: 'rest-branch-locations', label: 'Branch locations', kind: 'text', placeholder: 'e.g. Indiranagar, Koramangala' },
  ],
  'Real Estate': [
    { id: 're-listings', label: 'Property listings?', kind: 'yesno' },
    { id: 're-search', label: 'Property search?', kind: 'yesno' },
    { id: 're-filters', label: 'Filters (price, type, locality…)?', kind: 'yesno' },
    { id: 're-detail-pages', label: 'Property detail pages?', kind: 'yesno' },
    { id: 're-buy-rent', label: 'Buy / Rent?', kind: 'multi', options: ['Buy', 'Rent', 'Both'] },
    { id: 're-agents', label: 'Agent profiles?', kind: 'yesno' },
    { id: 're-map', label: 'Map integration?', kind: 'yesno' },
    { id: 're-inquiry', label: 'Inquiry form?', kind: 'yesno' },
    { id: 're-submission', label: 'Property submission (list a property)?', kind: 'yesno' },
    { id: 're-featured', label: 'Featured listings?', kind: 'yesno' },
  ],
  SaaS: [
    { id: 'saas-auth', label: 'Authentication?', kind: 'yesno' },
    { id: 'saas-registration', label: 'User registration?', kind: 'yesno' },
    { id: 'saas-login', label: 'Login?', kind: 'yesno' },
    { id: 'saas-dashboard', label: 'Dashboard?', kind: 'yesno' },
    { id: 'saas-plans', label: 'Subscription plans?', kind: 'yesno' },
    { id: 'saas-trial', label: 'Free trial?', kind: 'yesno' },
    { id: 'saas-billing', label: 'Payment / subscription billing?', kind: 'yesno' },
    { id: 'saas-profile', label: 'User profile?', kind: 'yesno' },
    { id: 'saas-admin', label: 'Admin dashboard?', kind: 'yesno' },
    { id: 'saas-usage', label: 'Usage / account management?', kind: 'yesno' },
  ],
  Portfolio: [
    { id: 'port-projects', label: 'Projects / case studies?', kind: 'yesno' },
    { id: 'port-categories', label: 'Project categories?', kind: 'yesno' },
    { id: 'port-gallery', label: 'Gallery?', kind: 'yesno' },
    { id: 'port-testimonials', label: 'Testimonials?', kind: 'yesno' },
    { id: 'port-services', label: 'Services?', kind: 'yesno' },
    { id: 'port-resume', label: 'Resume / CV?', kind: 'yesno' },
    { id: 'port-cta', label: 'Contact CTA?', kind: 'yesno' },
    { id: 'port-social', label: 'Social links?', kind: 'yesno' },
  ],
  Blog: [
    { id: 'blog-categories', label: 'Categories?', kind: 'yesno' },
    { id: 'blog-authors', label: 'Author profiles?', kind: 'yesno' },
    { id: 'blog-search', label: 'Search?', kind: 'yesno' },
    { id: 'blog-tags', label: 'Tags?', kind: 'yesno' },
    { id: 'blog-newsletter', label: 'Newsletter?', kind: 'yesno' },
    { id: 'blog-comments', label: 'Comments?', kind: 'yesno' },
    { id: 'blog-cms', label: 'CMS / content management?', kind: 'yesno' },
  ],
  'Landing Page': [
    { id: 'lp-lead-capture', label: 'Lead capture?', kind: 'yesno' },
    { id: 'lp-cta-destination', label: 'Where should the CTA lead?', kind: 'text', placeholder: 'e.g. Contact form, WhatsApp, booking link' },
    { id: 'lp-contact-form', label: 'Contact form?', kind: 'yesno' },
    { id: 'lp-newsletter', label: 'Newsletter?', kind: 'yesno' },
    { id: 'lp-testimonials', label: 'Testimonials?', kind: 'yesno' },
    { id: 'lp-pricing', label: 'Pricing?', kind: 'yesno' },
    { id: 'lp-faq', label: 'FAQ?', kind: 'yesno' },
    { id: 'lp-tracking', label: 'Conversion tracking?', kind: 'yesno' },
  ],
  'Business Website': [
    { id: 'bw-services', label: 'Services?', kind: 'yesno' },
    { id: 'bw-team', label: 'Team?', kind: 'yesno' },
    { id: 'bw-testimonials', label: 'Testimonials?', kind: 'yesno' },
    { id: 'bw-contact-form', label: 'Contact form?', kind: 'yesno' },
    { id: 'bw-map', label: 'Location / map?', kind: 'yesno' },
    { id: 'bw-booking', label: 'Booking?', kind: 'yesno' },
    { id: 'bw-leads', label: 'Lead generation?', kind: 'yesno' },
    { id: 'bw-blog', label: 'Blog?', kind: 'yesno' },
  ],
  Custom: [
    {
      id: 'custom-requirements',
      label: 'Additional project requirements',
      kind: 'textarea',
      placeholder: 'Describe anything specific about this project — goals, integrations, must-haves, references…',
    },
  ],
};

/** Questions for a given website type (empty array for unknown types). */
export function getTypeQuestions(websiteType: string): TypeQuestion[] {
  return TYPE_QUESTIONS[websiteType] ?? [];
}

/* ------------------------------------------------------------------ */
/* Answer formatting helpers (profile, review, PDF, analysis)          */
/* ------------------------------------------------------------------ */

/** Human-readable value for a single answer. */
export function formatDynamicAnswer(answer: DynamicAnswer | undefined): string {
  if (answer === undefined || answer === null) return '';
  if (typeof answer === 'boolean') return answer ? 'Yes' : 'No';
  if (Array.isArray(answer)) return answer.length > 0 ? answer.join(', ') : '';
  return String(answer).trim();
}

/** Ordered question → answer rows for a client, skipping unanswered questions. */
export function dynamicAnswerRows(
  dynamicAnswers: DynamicAnswers | null | undefined,
  websiteType: string
): Array<{ label: string; value: string }> {
  if (!dynamicAnswers) return [];
  return getTypeQuestions(websiteType)
    .map((q) => ({ label: q.label, value: formatDynamicAnswer(dynamicAnswers[q.id]) }))
    .filter((r) => r.value.length > 0);
}

/** One-line summary of answered questions, e.g. "Shopping cart: Yes, Payment: Yes". */
export function summarizeDynamicAnswers(
  dynamicAnswers: DynamicAnswers | null | undefined,
  websiteType: string
): string {
  return dynamicAnswerRows(dynamicAnswers, websiteType)
    .map((r) => `${r.label}: ${r.value}`)
    .join('; ');
}

/** Labels of questions answered "Yes" — used by the generator for grounded content. */
export function dynamicTrueLabels(client: Pick<Client, 'projectType' | 'dynamicAnswers'>): string[] {
  if (!client.dynamicAnswers) return [];
  return getTypeQuestions(client.projectType)
    .filter((q) => q.kind === 'yesno' && client.dynamicAnswers?.[q.id] === true)
    .map((q) => q.label.replace(/\?$/, ''));
}

/** Readable value for a question id (used for tooltips/debug). */
export function questionLabel(websiteType: string, id: string): string | undefined {
  return getTypeQuestions(websiteType).find((q) => q.id === id)?.label;
}