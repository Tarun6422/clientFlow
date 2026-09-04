import { useState, type ReactNode } from 'react';
import {
  Briefcase,
  Building2,
  Check,
  Eye,
  FileText,
  Layers,
  Pencil,
  PenLine,
  Plus,
  Rocket,
  ShoppingCart,
  Sparkles,
  User,
  UtensilsCrossed,
  X,
  type LucideIcon,
} from 'lucide-react';
import type { ClientDraft } from '../../types';
import { Input, Textarea, Chip } from '../../components/form';
import { cn, formatLongDate } from '../../lib/utils';
import {
  BUDGETS,
  CLIENT_TYPES,
  CONTACT_METHODS,
  CONTENT_PROVIDERS,
  FEATURES,
  INDUSTRIES,
  PAGES,
  PROJECT_TYPES,
} from '../../lib/constants';
import { THEMES } from '../../themes';
import ThemeCard from '../../components/ThemeCard';
import ThemePreviewModal from '../../components/ThemePreviewModal';
import ScaledPreview from '../../components/ScaledPreview';

/* ------------------------------------------------------------------ */
/* Shared step building blocks                                         */
/* ------------------------------------------------------------------ */

interface StepProps {
  draft: ClientDraft;
  update: <K extends keyof ClientDraft>(key: K, value: ClientDraft[K]) => void;
  errors: Record<string, string>;
}

function StepIntro({ icon: Icon, title, subtitle }: { icon: LucideIcon; title: string; subtitle: string }) {
  return (
    <div className="mb-6 flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
        <Icon size={19} />
      </span>
      <div>
        <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">{title}</h2>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
      </div>
    </div>
  );
}

function Grid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('grid gap-4 sm:grid-cols-2', className)}>{children}</div>;
}

function Subheading({ children, count }: { children: ReactNode; count?: number }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-[13px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {children}
      </h3>
      {count !== undefined && (
        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
          {count} selected
        </span>
      )}
    </div>
  );
}

function ChoiceChips({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <Chip key={o} active={value === o} onClick={() => onChange(value === o ? '' : o)}>
          {o}
        </Chip>
      ))}
    </div>
  );
}

function MultiChips({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <Chip key={o} active={selected.includes(o)} onClick={() => onToggle(o)}>
          {o}
        </Chip>
      ))}
    </div>
  );
}

function toggleIn(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function CustomAdder({
  placeholder,
  items,
  onAdd,
  onRemove,
  label,
}: {
  placeholder: string;
  items: string[];
  onAdd: (value: string) => void;
  onRemove: (value: string) => void;
  label: string;
}) {
  const [value, setValue] = useState('');
  const add = () => {
    const clean = value.trim();
    if (clean && !items.some((i) => i.toLowerCase() === clean.toLowerCase())) {
      onAdd(clean);
      setValue('');
    } else if (clean) {
      setValue('');
    }
  };
  return (
    <div>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          aria-label={label}
          className="input"
        />
        <button onClick={add} className="btn-secondary shrink-0" aria-label={`Add ${label.toLowerCase()}`}>
          <Plus size={16} /> Add
        </button>
      </div>
      {items.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-1.5 text-[13px] font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
            >
              {item}
              <button
                onClick={() => onRemove(item)}
                className="text-brand-400 hover:text-brand-700 dark:hover:text-brand-200"
                aria-label={`Remove ${item}`}
              >
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/* STEP 1 — CLIENT INFORMATION                                         */
/* ================================================================== */

export function StepClient({ draft, update, errors }: StepProps) {
  return (
    <div>
      <StepIntro
        icon={Building2}
        title="Client Information"
        subtitle="Tell us who you're working with. Name and email are required."
      />
      <Grid>
        <div className="sm:col-span-2">
          <Input
            label="Full Name"
            required
            value={draft.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="e.g. Aarav Mehta"
            error={errors.name}
            autoFocus
          />
        </div>
        <Input
          label="Company Name"
          value={draft.company}
          onChange={(e) => update('company', e.target.value)}
          placeholder="e.g. WoodCraft Furniture"
        />
        <Input
          label="Email"
          type="email"
          required
          value={draft.email}
          onChange={(e) => update('email', e.target.value)}
          placeholder="client@company.com"
          error={errors.email}
        />
        <Input
          label="Phone"
          type="tel"
          value={draft.phone}
          onChange={(e) => update('phone', e.target.value)}
          placeholder="+91 98XXX XXXXX"
        />
        <Input
          label="WhatsApp Number"
          value={draft.whatsapp}
          onChange={(e) => update('whatsapp', e.target.value)}
          placeholder="+91 98XXX XXXXX"
        />
        <Input
          label="Country"
          value={draft.country}
          onChange={(e) => update('country', e.target.value)}
          placeholder="India"
        />
        <Input
          label="City"
          value={draft.city}
          onChange={(e) => update('city', e.target.value)}
          placeholder="Mumbai"
        />
        <div className="sm:col-span-2">
          <Input
            label="Address"
            value={draft.address}
            onChange={(e) => update('address', e.target.value)}
            placeholder="Street, area, pincode"
          />
        </div>
        <div>
          <Subheading>Preferred contact method</Subheading>
          <ChoiceChips
            options={CONTACT_METHODS}
            value={draft.preferredContact}
            onChange={(v) => update('preferredContact', v)}
          />
        </div>
        <div>
          <Subheading>Client type</Subheading>
          <ChoiceChips options={CLIENT_TYPES} value={draft.clientType} onChange={(v) => update('clientType', v)} />
        </div>
      </Grid>
    </div>
  );
}

/* ================================================================== */
/* STEP 2 — BUSINESS INFORMATION                                       */
/* ================================================================== */

export function StepBusiness({ draft, update }: StepProps) {
  return (
    <div>
      <StepIntro
        icon={Briefcase}
        title="Business Information"
        subtitle="Understand the business behind the website so the brief speaks their language."
      />
      <Grid>
        <Input
          label="Business Name"
          value={draft.businessName}
          onChange={(e) => update('businessName', e.target.value)}
          placeholder="e.g. WoodCraft Furniture"
        />
        <Input
          label="Years in Business"
          value={draft.yearsInBusiness}
          onChange={(e) => update('yearsInBusiness', e.target.value)}
          placeholder="e.g. 5"
          inputMode="numeric"
        />
        <div className="sm:col-span-2">
          <Subheading>Industry</Subheading>
          <ChoiceChips options={INDUSTRIES} value={draft.industry} onChange={(v) => update('industry', v)} />
        </div>
        <div className="sm:col-span-2">
          <Input
            label="Existing Website"
            type="url"
            value={draft.existingWebsite}
            onChange={(e) => update('existingWebsite', e.target.value)}
            placeholder="https://example.com"
          />
        </div>
        <div className="sm:col-span-2">
          <Textarea
            label="What does the business do?"
            value={draft.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="Describe the products/services, customers and what makes the business unique — this powers the project summary and PDF brief."
            className="min-h-[120px]"
          />
        </div>
        <div className="sm:col-span-2">
          <Subheading>Social links</Subheading>
          <Grid>
            <Input
              label="Instagram"
              value={draft.instagram}
              onChange={(e) => update('instagram', e.target.value)}
              placeholder="https://instagram.com/…"
            />
            <Input
              label="Facebook"
              value={draft.facebook}
              onChange={(e) => update('facebook', e.target.value)}
              placeholder="https://facebook.com/…"
            />
            <Input
              label="LinkedIn"
              value={draft.linkedin}
              onChange={(e) => update('linkedin', e.target.value)}
              placeholder="https://linkedin.com/company/…"
            />
            <Input
              label="Other Social Link"
              value={draft.otherSocial}
              onChange={(e) => update('otherSocial', e.target.value)}
              placeholder="https://twitter.com/…"
            />
          </Grid>
        </div>
      </Grid>
    </div>
  );
}

/* ================================================================== */
/* STEP 3 — PROJECT INFORMATION                                        */
/* ================================================================== */

const TYPE_ICONS: Record<string, LucideIcon> = {
  briefcase: Briefcase,
  rocket: Rocket,
  user: User,
  cart: ShoppingCart,
  layers: Layers,
  pen: PenLine,
  utensils: UtensilsCrossed,
  building: Building2,
  sparkles: Sparkles,
};

export function StepProject({ draft, update }: StepProps) {
  return (
    <div>
      <StepIntro
        icon={Briefcase}
        title="Project Information"
        subtitle="What are we building, for whom, and on what timeline and budget?"
      />

      <Subheading>What type of website does the client need?</Subheading>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {PROJECT_TYPES.map((type) => {
          const Icon = TYPE_ICONS[type.icon];
          const active = draft.projectType === type.id;
          return (
            <button
              key={type.id}
              onClick={() => update('projectType', active ? '' : type.id)}
              aria-pressed={active}
              className={cn(
                'flex cursor-pointer flex-col items-center gap-2.5 rounded-2xl border-2 px-3 py-5 text-center transition-all',
                active
                  ? 'border-brand-600 bg-brand-50/70 shadow-sm shadow-brand-600/20 dark:bg-brand-500/10'
                  : 'border-slate-200 bg-white hover:border-brand-300 hover:bg-brand-50/40 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-brand-500/40'
              )}
            >
              <span
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
                  active
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'
                )}
              >
                {Icon ? <Icon size={19} /> : <Sparkles size={19} />}
              </span>
              <span
                className={cn(
                  'text-[13px] font-semibold leading-tight',
                  active ? 'text-brand-700 dark:text-brand-300' : 'text-slate-600 dark:text-slate-300'
                )}
              >
                {type.id}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-7">
        <Grid>
          <div className="sm:col-span-2">
            <Textarea
              label="Project Goal"
              hint="What is the main goal of this website?"
              value={draft.projectGoal}
              onChange={(e) => update('projectGoal', e.target.value)}
              placeholder="e.g. Showcase our catalog and convert visitors into quote requests…"
              className="min-h-[96px]"
            />
          </div>
          <div className="sm:col-span-2">
            <Input
              label="Target Audience"
              hint="Who is the website for?"
              value={draft.targetAudience}
              onChange={(e) => update('targetAudience', e.target.value)}
              placeholder="e.g. Homeowners and interior designers in Mumbai…"
            />
          </div>
          <Input
            label="Project Deadline"
            type="date"
            value={draft.deadline}
            onChange={(e) => update('deadline', e.target.value)}
          />
          <div>
            <Subheading>Budget</Subheading>
            <div className="flex flex-wrap gap-2">
              {BUDGETS.map((b) => (
                <Chip key={b} active={draft.budget === b} onClick={() => update('budget', draft.budget === b ? '' : b)}>
                  {b}
                </Chip>
              ))}
            </div>
          </div>
        </Grid>
      </div>
    </div>
  );
}

/* ================================================================== */
/* STEP 4 — WEBSITE REQUIREMENTS                                       */
/* ================================================================== */

export function StepRequirements({ draft, update }: StepProps) {
  const togglePage = (p: string) => update('pages', toggleIn(draft.pages, p));
  const toggleFeature = (f: string) => update('features', toggleIn(draft.features, f));
  const allCustomPages = draft.customPages;
  const allCustomFeatures = draft.customFeatures;

  return (
    <div className="space-y-8">
      <StepIntro
        icon={FileText}
        title="Website Requirements"
        subtitle="Pin down the pages, features and content plan for the project."
      />

      <div>
        <Subheading count={draft.pages.length + allCustomPages.length}>Required Pages</Subheading>
        <MultiChips options={PAGES} selected={draft.pages} onToggle={togglePage} />
        <div className="mt-3">
          <CustomAdder
            label="Custom page"
            placeholder="Add a custom page, e.g. Careers, Gallery…"
            items={allCustomPages}
            onAdd={(v) => update('customPages', [...allCustomPages, v])}
            onRemove={(v) => update('customPages', allCustomPages.filter((x) => x !== v))}
          />
        </div>
      </div>

      <div>
        <Subheading count={draft.features.length + allCustomFeatures.length}>Required Features</Subheading>
        <MultiChips options={FEATURES} selected={draft.features} onToggle={toggleFeature} />
        <div className="mt-3">
          <CustomAdder
            label="Custom feature"
            placeholder="Add a custom feature, e.g. EMI Calculator…"
            items={allCustomFeatures}
            onAdd={(v) => update('customFeatures', [...allCustomFeatures, v])}
            onRemove={(v) => update('customFeatures', allCustomFeatures.filter((x) => x !== v))}
          />
        </div>
      </div>

      <div>
        <Subheading>Content</Subheading>
        <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
          Who will provide the website content?
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CONTENT_PROVIDERS.map((provider) => {
            const active = draft.contentProvider === provider;
            return (
              <button
                key={provider}
                onClick={() => update('contentProvider', active ? '' : provider)}
                aria-pressed={active}
                className={cn(
                  'flex cursor-pointer items-center justify-center rounded-xl border-2 px-3 py-3.5 text-sm font-semibold transition-all',
                  active
                    ? 'border-brand-600 bg-brand-600 text-white shadow-sm shadow-brand-600/25'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-brand-500/40'
                )}
              >
                {provider}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <Subheading>Additional Requirements</Subheading>
        <Textarea
          value={draft.notes}
          onChange={(e) => update('notes', e.target.value)}
          placeholder="Special requirements, extra notes, references, do's and don'ts…"
          className="min-h-[120px]"
        />
      </div>
    </div>
  );
}

/* ================================================================== */
/* STEP 5 — WEBSITE THEMES                                             */
/* ================================================================== */

export function StepTheme({ draft, update }: StepProps) {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const previewTheme = THEMES.find((t) => t.id === previewId) ?? null;

  return (
    <div>
      <StepIntro
        icon={Sparkles}
        title="Select a Website Theme"
        subtitle="Preview each design direction live — the chosen theme is stored with the client and appears in the brief."
      />
      <div className="grid gap-5 md:grid-cols-2">
        {THEMES.map((theme) => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            selected={draft.theme === theme.id}
            onPreview={() => setPreviewId(theme.id)}
            onSelect={() => update('theme', theme.id)}
          />
        ))}
      </div>
      {previewTheme && (
        <ThemePreviewModal
          theme={previewTheme}
          selectLabel={draft.theme === previewTheme.id ? 'Keep This Theme' : 'Select This Theme'}
          onSelect={() => {
            update('theme', previewTheme.id);
            setPreviewId(null);
          }}
          onClose={() => setPreviewId(null)}
        />
      )}
    </div>
  );
}

/* ================================================================== */
/* STEP 6 — REVIEW                                                     */
/* ================================================================== */

export interface ReviewSectionProps {
  draft: ClientDraft;
  clientId?: string;
  goToStep: (idx: number) => void;
}

function ReviewCard({
  title,
  step,
  onEdit,
  children,
  className,
}: {
  title: string;
  step?: number;
  onEdit?: (step: number) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('card p-5', className)}>
      <header className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
        {step && (
          <button
            onClick={() => onEdit?.(step)}
            className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-slate-400 transition-colors hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800 dark:hover:text-brand-400"
          >
            <Pencil size={12} /> Edit
          </button>
        )}
      </header>
      {children}
    </section>
  );
}

function RRow({ label, value }: { label: string; value?: string }) {
  if (!value || !value.trim()) return null;
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <span className="min-w-0 text-right text-[13px] font-medium text-slate-700 dark:text-slate-200">
        {value}
      </span>
    </div>
  );
}

function TagRow({ items, empty }: { items: string[]; empty?: string }) {
  if (items.length === 0) {
    return <p className="text-[13px] italic text-slate-400 dark:text-slate-500">{empty ?? 'Not specified'}</p>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

export function StepReview({ draft, goToStep }: ReviewSectionProps) {
  const theme = draft.theme ? THEMES.find((t) => t.id === draft.theme) : undefined;
  const location = [draft.city, draft.country].filter(Boolean).join(', ');
  const business = draft.businessName || draft.company;
  const socials = [draft.instagram, draft.facebook, draft.linkedin, draft.otherSocial].filter(Boolean);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            Review Client Brief
          </h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Everything below is saved with the client. Edit any section, then save or export the PDF.
          </p>
        </div>
        <span className="hidden rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600 ring-1 ring-inset ring-emerald-200 sm:inline dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30">
          Ready to save
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ReviewCard title="Client Information" step={0} onEdit={goToStep}>
          <RRow label="Name" value={draft.name} />
          <RRow label="Company" value={draft.company} />
          <RRow label="Email" value={draft.email} />
          <RRow label="Phone" value={draft.phone} />
          <RRow label="WhatsApp" value={draft.whatsapp} />
          <RRow label="Location" value={location || draft.address} />
          <RRow label="Contact via" value={draft.preferredContact} />
          <RRow label="Client type" value={draft.clientType} />
        </ReviewCard>

        <ReviewCard title="Business Information" step={1} onEdit={goToStep}>
          <RRow label="Business" value={business} />
          <RRow label="Industry" value={draft.industry} />
          <RRow label="Years" value={draft.yearsInBusiness && `${draft.yearsInBusiness} years`} />
          <RRow label="Website" value={draft.existingWebsite} />
          {socials.length > 0 && (
            <div className="flex items-start justify-between gap-4 py-1">
              <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Social</span>
              <span className="min-w-0 text-right text-[13px] font-medium text-slate-700 dark:text-slate-200">
                {socials.join(' · ')}
              </span>
            </div>
          )}
          {draft.description && (
            <p className="mt-2 border-t border-slate-100 pt-2 text-[13px] leading-relaxed text-slate-500 dark:border-slate-800 dark:text-slate-400">
              {draft.description}
            </p>
          )}
        </ReviewCard>

        <ReviewCard title="Project Overview" step={2} onEdit={goToStep}>
          <RRow label="Website type" value={draft.projectType} />
          <RRow label="Goal" value={draft.projectGoal} />
          <RRow label="Audience" value={draft.targetAudience} />
          <RRow label="Budget" value={draft.budget} />
          <RRow
            label="Deadline"
            value={draft.deadline ? formatLongDate(new Date(draft.deadline).getTime()) : undefined}
          />
          <RRow label="Content by" value={draft.contentProvider} />
        </ReviewCard>

        <div className="space-y-4">
          <ReviewCard title="Website Pages" step={3} onEdit={goToStep}>
            <TagRow items={[...draft.pages, ...draft.customPages]} empty="No pages selected yet" />
          </ReviewCard>
          <ReviewCard title="Features" step={3} onEdit={goToStep}>
            <TagRow items={[...draft.features, ...draft.customFeatures]} empty="No features selected yet" />
          </ReviewCard>
        </div>

        <ReviewCard title="Selected Theme" step={4} onEdit={goToStep}>
          {theme ? (
            <div className="grid items-center gap-4 sm:grid-cols-[200px_1fr]">
              <button
                onClick={() => goToStep(4)}
                className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700"
                aria-label={`Change theme (currently ${theme.name})`}
              >
                <ScaledPreview clipHeight={300} className="w-full">
                  <theme.preview />
                </ScaledPreview>
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full border border-slate-200 dark:border-slate-700"
                    style={{ backgroundColor: theme.palette.primary }}
                  />
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{theme.name}</span>
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
                  {theme.description}
                </p>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-400">
                  <Eye size={13} /> Preview &amp; change in step 5
                </span>
              </div>
            </div>
          ) : (
            <p className="text-[13px] italic text-slate-400 dark:text-slate-500">
              No theme selected — pick one of the six design directions.
            </p>
          )}
        </ReviewCard>

        <ReviewCard title="Additional Requirements" step={3} onEdit={goToStep}>
          <p className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
            {draft.notes || 'No additional requirements noted.'}
          </p>
        </ReviewCard>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-brand-300 bg-brand-50/50 px-5 py-4 dark:border-brand-500/40 dark:bg-brand-500/5">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white">
            <Check size={17} strokeWidth={3} />
          </span>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">Brief complete — almost there</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Save the client to store this brief, or generate a downloadable PDF right now.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}