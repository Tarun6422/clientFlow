export type ClientStatus =
  | 'Draft'
  | 'Requirement Collected'
  | 'In Progress'
  | 'Review'
  | 'Prototype Approved'
  | 'Changes Requested'
  | 'Completed';

/* ------------------------------------------------------------------ */
/* Prototype data model (ClientFlow 2.0)                              */
/* ------------------------------------------------------------------ */

export interface SitemapPage {
  id: string;
  label: string;
}

export type PrototypeSectionType =
  | 'hero'
  | 'features'
  | 'services'
  | 'products'
  | 'testimonials'
  | 'cta'
  | 'stats'
  | 'gallery'
  | 'logos'
  | 'contact'
  | 'faq'
  | 'team'
  | 'pricing'
  | 'blog'
  | 'cards'
  | 'text';

export interface PrototypeItem {
  id: string;
  title: string;
  description: string;
  /** Secondary label — e.g. price, role, author. */
  meta?: string;
  /** Placeholder image label. */
  image?: string;
  cta?: string;
}

export interface PrototypeSection {
  id: string;
  type: PrototypeSectionType;
  title: string;
  subtitle?: string;
  items: PrototypeItem[];
  cta?: { label: string; href?: string };
  /** Placeholder image label for the section (hero images etc.). */
  image?: string;
  align?: 'left' | 'center';
  /** Blueprint metadata — where this section came from. */
  purpose?: string;
  contentDirection?: string;
  visualDirection?: string;
}

export interface PrototypePage {
  id: string;
  label: string;
  sections: PrototypeSection[];
}

export type PrototypeSpacing = 'compact' | 'comfortable' | 'spacious';
export type PrototypeFont = 'sans' | 'serif' | 'display';
export type PrototypeButton = 'solid' | 'outline' | 'soft' | 'pill';

export interface PrototypeDesign {
  theme: string;
  colors: ThemePalette;
  radius: number;
  spacing: PrototypeSpacing;
  font: PrototypeFont;
  buttons: PrototypeButton;
}

export interface PrototypeSnapshot {
  pages: PrototypePage[];
  design: PrototypeDesign;
  /** Display name for the site (client business) — kept out of version data comparisons. */
  businessLabel?: string;
}

export interface PrototypeVersion {
  number: number;
  date: number;
  status: 'Draft' | 'Preview' | 'Prototype Approved' | 'Changes Requested';
  note?: string;
  data: PrototypeSnapshot;
}

export interface ClientFeedback {
  id: string;
  text: string;
  date: number;
  status: 'Open' | 'Addressed' | 'Resolved';
}

export interface ApprovalInfo {
  approved: boolean;
  date?: number;
  version?: number;
}

/* ------------------------------------------------------------------ */
/* AI analysis / blueprints                                            */
/* ------------------------------------------------------------------ */

export interface AiAnalysisField {
  label: string;
  value: string;
  missing?: boolean;
}

export interface AiAnalysis {
  generatedAt: number;
  clientName: string;
  business: string;
  websiteType: string;
  summary: string;
  fields: AiAnalysisField[];
  missing: string[];
  suggestions: string[];
}

export interface BlueprintSection {
  name: string;
  purpose: string;
  contentDirection: string;
  cta: string;
  visualDirection: string;
}

export interface PageBlueprint {
  pageId: string;
  pageName: string;
  sections: BlueprintSection[];
}

/* ------------------------------------------------------------------ */
/* Core client record                                                  */
/* ------------------------------------------------------------------ */

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  whatsapp: string;
  country: string;
  city: string;
  address: string;
  preferredContact: string;
  clientType: string;
  businessName: string;
  industry: string;
  description: string;
  yearsInBusiness: string;
  existingWebsite: string;
  instagram: string;
  facebook: string;
  linkedin: string;
  otherSocial: string;
  projectType: string;
  projectGoal: string;
  targetAudience: string;
  deadline: string;
  budget: string;
  pages: string[];
  customPages: string[];
  features: string[];
  customFeatures: string[];
  contentProvider: string;
  notes: string;
  theme: string;
  status: ClientStatus;
  createdAt: number;
  updatedAt: number;

  /* --- ClientFlow 2.0: AI-generated content (kept separate from the
     original client answers above) --- */
  aiAnalysis?: AiAnalysis | null;
  sitemap?: SitemapPage[] | null;
  pageBlueprints?: PageBlueprint[] | null;
  prototype?: PrototypeSnapshot | null;
  prototypeVersions?: PrototypeVersion[];
  feedback?: ClientFeedback[];
  approval?: ApprovalInfo;

  /* --- Website-type specific answers (wizard → dynamic questions) --- */
  /** Flat map of question id → answer. Yes/no questions store booleans,
      multi-select store string[], text/number questions store strings. */
  dynamicAnswers?: Record<string, string | string[] | boolean> | null;
  /** Fingerprint of the source fields the prototype was generated from.
      Used to detect when the prototype is out of date after client edits. */
  prototypeSourceHash?: string | null;
}

export type ClientDraft = Omit<Client, 'id' | 'status' | 'createdAt' | 'updatedAt'>;

export interface Settings {
  agencyName: string;
  logo: string;
  email: string;
  phone: string;
  defaultCurrency: string;
  pdfFooter: string;
  defaultTheme: string;
  /* AI provider — 'local' always works offline; 'custom' uses a user-supplied
     OpenAI-compatible endpoint. Keys are stored in the user's own settings. */
  aiProvider: 'local' | 'custom';
  aiEndpoint: string;
  aiApiKey: string;
  aiModel: string;
}

export interface ThemePalette {
  bg: string;
  surface: string;
  text: string;
  muted: string;
  primary: string;
  secondary: string;
  accent: string;
}

export interface ThemeDef {
  id: string;
  name: string;
  description: string;
  tags: string[];
  palette: ThemePalette;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

export type ViewMode = 'grid' | 'table';