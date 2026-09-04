import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Briefcase,
  Check,
  ClipboardList,
  FileText,
  Layers,
  Palette,
  User,
  type LucideIcon,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Client, ClientDraft } from '../../types';
import { cn, clamp } from '../../lib/utils';
import {
  StepClient,
  StepBusiness,
  StepProject,
  StepRequirements,
  StepTheme,
  StepReview,
} from './steps';
import { generateClientPdf } from '../../lib/pdf';

interface StepDef {
  label: string;
  icon: LucideIcon;
}

const STEPS: StepDef[] = [
  { label: 'Client', icon: User },
  { label: 'Business', icon: Building2 },
  { label: 'Project', icon: Briefcase },
  { label: 'Requirements', icon: Layers },
  { label: 'Theme', icon: Palette },
  { label: 'Review', icon: ClipboardList },
];

export function emptyDraft(defaultTheme = ''): ClientDraft {
  return {
    name: '',
    company: '',
    email: '',
    phone: '',
    whatsapp: '',
    country: '',
    city: '',
    address: '',
    preferredContact: '',
    clientType: '',
    businessName: '',
    industry: '',
    description: '',
    yearsInBusiness: '',
    existingWebsite: '',
    instagram: '',
    facebook: '',
    linkedin: '',
    otherSocial: '',
    projectType: '',
    projectGoal: '',
    targetAudience: '',
    deadline: '',
    budget: '',
    pages: [],
    customPages: [],
    features: [],
    customFeatures: [],
    contentProvider: '',
    notes: '',
    theme: defaultTheme,
  };
}

export function toDraft(client: Client): ClientDraft {
  const { id: _id, status: _status, createdAt: _c, updatedAt: _u, ...rest } = client;
  return rest;
}

export default function WizardPage({ clientId }: { clientId?: string }) {
  const { clients, settings, addClient, updateClient, toast } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const editing = useMemo(
    () => clients.find((c) => c.id === clientId),
    [clients, clientId]
  );

  const [draft, setDraft] = useState<ClientDraft>(() =>
    editing ? toDraft(editing) : emptyDraft(settings.defaultTheme)
  );
  const [step, setStep] = useState<number>(() => {
    const from = parseInt(searchParams.get('step') ?? '1', 10);
    return clamp(Number.isFinite(from) ? from - 1 : 0, 0, STEPS.length - 1);
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdit = Boolean(editing);
  const backTo = isEdit ? `/clients/${clientId}` : '/clients';

  const update = <K extends keyof ClientDraft>(key: K, value: ClientDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    if (typeof value === 'string' && value.trim() && errors[key as string]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key as string];
        return next;
      });
    }
  };

  const validateStep = (idx: number): boolean => {
    if (idx !== 0) return true;
    const next: Record<string, string> = {};
    if (!draft.name.trim()) next.name = 'Full name is required.';
    if (!draft.email.trim()) {
      next.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(draft.email.trim())) {
      next.email = 'Enter a valid email address.';
    }
    setErrors(next);
    if (Object.keys(next).length > 0) {
      toast('Please fix the highlighted fields.', 'warning');
      return false;
    }
    return true;
  };

  const goNext = () => {
    if (validateStep(step)) {
      setStep((s) => clamp(s + 1, 0, STEPS.length - 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goTo = (idx: number) => {
    if (idx < step || validateStep(step)) {
      setStep(clamp(idx, 0, STEPS.length - 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const saveClient = (status: Client['status']): string => {
    const now = Date.now();
    const data: Client = {
      ...draft,
      id: isEdit ? (clientId as string) : crypto.randomUUID?.() ?? `c-${now}`,
      status,
      createdAt: editing?.createdAt ?? now,
      updatedAt: now,
    };
    if (isEdit) {
      updateClient(data.id, { ...draft, status });
    } else {
      addClient(data);
    }
    return data.id;
  };

  const handleSave = () => {
    if (!validateStep(0)) {
      goTo(0);
      return;
    }
    // A fresh client is marked “Requirement Collected” once requirements exist;
    // edits always keep their current status.
    const collected =
      draft.pages.length > 0 || draft.features.length > 0 || draft.projectType.length > 0;
    const status = isEdit
      ? (editing?.status ?? 'Draft')
      : collected
        ? 'Requirement Collected'
        : 'Draft';
    const id = saveClient(status);
    toast(isEdit ? 'Client updated successfully.' : 'Client saved successfully.');
    navigate(`/clients/${id}`);
  };

  const handleSaveDraft = () => {
    const status = isEdit ? (editing?.status ?? 'Draft') : 'Draft';
    const id = saveClient(status);
    toast('Draft saved.');
    navigate(`/clients/${id}`);
  };

  const handlePdf = () => {
    const temp: Client = {
      ...draft,
      id: clientId ?? 'draft',
      status: 'Draft',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    generateClientPdf(temp, settings);
    toast('PDF generated successfully.');
  };

  const stepProps = { draft, update, errors };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <Link
          to={backTo}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400"
        >
          <ArrowLeft size={16} /> {isEdit ? 'Back to profile' : 'Cancel'}
        </Link>
        <span className="text-sm text-slate-400 dark:text-slate-500">
          Step {step + 1} of {STEPS.length}
        </span>
      </div>

      {/* Card */}
      <div className="card overflow-hidden">
        {/* Progress */}
        <div className="border-b border-slate-200 px-4 py-4 sm:px-7 dark:border-slate-800">
          <ol className="flex items-center gap-1 overflow-x-auto scrollbar-none sm:gap-2">
            {STEPS.map((s, i) => {
              const done = i < step;
              const current = i === step;
              return (
                <li key={s.label} className="flex shrink-0 items-center gap-1 sm:gap-2">
                  <button
                    onClick={() => goTo(i)}
                    className={cn(
                      'flex items-center gap-2 rounded-full px-2 py-1 text-xs font-semibold transition-all sm:px-3 sm:py-1.5 sm:text-[13px]',
                      current &&
                        'bg-brand-600 text-white shadow-sm shadow-brand-600/30',
                      done && 'cursor-pointer text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10',
                      !done && !current && 'text-slate-400 hover:text-slate-600 dark:text-slate-500'
                    )}
                    aria-current={current ? 'step' : undefined}
                  >
                    <span
                      className={cn(
                        'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold',
                        current && 'bg-white/20',
                        done && 'bg-brand-600 text-white',
                        !done && !current && 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      )}
                    >
                      {done ? <Check size={12} strokeWidth={3.5} /> : i + 1}
                    </span>
                    <span className="hidden md:inline">{s.label}</span>
                    <s.icon size={14} className="md:hidden" />
                  </button>
                  {i < STEPS.length - 1 && (
                    <span
                      className={cn(
                        'h-px w-3 sm:w-6',
                        i < step ? 'bg-brand-500' : 'bg-slate-200 dark:bg-slate-700'
                      )}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        {/* Step body */}
        <div className="px-4 py-6 sm:px-7 sm:py-8">
          {step === 0 && <StepClient {...stepProps} />}
          {step === 1 && <StepBusiness {...stepProps} />}
          {step === 2 && <StepProject {...stepProps} />}
          {step === 3 && <StepRequirements {...stepProps} />}
          {step === 4 && <StepTheme {...stepProps} />}
          {step === 5 && (
            <StepReview
              draft={draft}
              clientId={clientId}
              goToStep={goTo}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7 dark:border-slate-800">
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button onClick={() => goTo(step - 1)} className="btn-secondary">
                <ArrowLeft size={16} /> Back
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button onClick={handleSaveDraft} className="btn-secondary">
              Save Draft
            </button>
            {step === STEPS.length - 1 ? (
              <>
                <button onClick={handlePdf} className="btn-secondary">
                  <FileText size={16} /> Generate PDF
                </button>
                <button onClick={handleSave} className="btn-primary">
                  <Check size={16} strokeWidth={3} /> {isEdit ? 'Save Changes' : 'Save Client'}
                </button>
              </>
            ) : (
              <button onClick={goNext} className="btn-primary">
                Next <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      <p className="pb-4 text-center text-xs text-slate-400 dark:text-slate-500">
        Everything you enter stays saved as you move between steps — nothing is lost when you go back.
      </p>
    </div>
  );
}