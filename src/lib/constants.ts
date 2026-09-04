import type { ClientStatus } from '../types';

export const CLIENT_TYPES = [
  'Individual',
  'Startup',
  'Small Business',
  'Agency',
  'Enterprise',
  'Other',
];

export const INDUSTRIES = [
  'Technology',
  'Restaurant',
  'E-commerce',
  'Real Estate',
  'Healthcare',
  'Education',
  'Finance',
  'Travel',
  'Fashion',
  'Fitness',
  'Professional Services',
  'Other',
];

export const PROJECT_TYPES = [
  { id: 'Business Website', icon: 'briefcase' },
  { id: 'Landing Page', icon: 'rocket' },
  { id: 'Portfolio', icon: 'user' },
  { id: 'E-commerce', icon: 'cart' },
  { id: 'SaaS', icon: 'layers' },
  { id: 'Blog', icon: 'pen' },
  { id: 'Restaurant', icon: 'utensils' },
  { id: 'Real Estate', icon: 'building' },
  { id: 'Custom', icon: 'sparkles' },
] as const;

export const PAGES = [
  'Home',
  'About',
  'Services',
  'Products',
  'Pricing',
  'Portfolio',
  'Blog',
  'Contact',
  'FAQ',
  'Testimonials',
  'Team',
  'Careers',
  'Privacy Policy',
  'Terms & Conditions',
];

export const FEATURES = [
  'WhatsApp Integration',
  'Contact Form',
  'Google Maps',
  'Newsletter',
  'Blog/CMS',
  'Search',
  'User Login',
  'User Registration',
  'Payment Gateway',
  'Shopping Cart',
  'Wishlist',
  'Booking System',
  'Appointment System',
  'Reviews',
  'Live Chat',
  'Admin Dashboard',
  'Analytics',
  'SEO',
  'Social Media Integration',
  'Multi-language',
];

export const BUDGETS = [
  'Under ₹25,000',
  '₹25,000 – ₹50,000',
  '₹50,000 – ₹1,00,000',
  '₹1,00,000 – ₹2,00,000',
  '₹2,00,000+',
  'Not Decided',
];

export const CONTENT_PROVIDERS = ['Client', 'Agency', 'AI Generated', 'Not Decided'];

export const CONTACT_METHODS = ['Email', 'Phone', 'WhatsApp', 'Video Call', 'In-Person Meeting'];

export const STATUSES: ClientStatus[] = [
  'Draft',
  'Requirement Collected',
  'In Progress',
  'Review',
  'Prototype Approved',
  'Changes Requested',
  'Completed',
];

export const STATUS_META: Record<
  ClientStatus,
  { classes: string; dot: string }
> = {
  Draft: {
    classes:
      'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
    dot: 'bg-slate-400',
  },
  'Requirement Collected': {
    classes:
      'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/30',
    dot: 'bg-indigo-500',
  },
  'In Progress': {
    classes:
      'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/30',
    dot: 'bg-blue-500',
  },
  Review: {
    classes:
      'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/30',
    dot: 'bg-violet-500',
  },
  'Prototype Approved': {
    classes:
      'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30',
    dot: 'bg-emerald-500',
  },
  'Changes Requested': {
    classes:
      'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30',
    dot: 'bg-amber-500',
  },
  Completed: {
    classes:
      'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30',
    dot: 'bg-emerald-500',
  },
};

export const CURRENCIES = ['₹ (INR)', '$ (USD)', '€ (EUR)', '£ (GBP)', 'AED (UAE)', 'Other'];

export const STORAGE_KEYS = {
  clients: 'clientflow:clients',
  settings: 'clientflow:settings',
  mode: 'clientflow:mode',
  seeded: 'clientflow:seeded',
};