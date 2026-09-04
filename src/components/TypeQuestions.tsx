import { Check } from 'lucide-react';
import type { DynamicAnswers, TypeQuestion } from '../lib/typeQuestions';
import { getTypeQuestions } from '../lib/typeQuestions';
import { cn } from '../lib/utils';
import { Chip } from './form';
import { Input, Textarea } from './form';

interface TypeQuestionsProps {
  websiteType: string;
  answers: DynamicAnswers | null | undefined;
  onChange: (patch: DynamicAnswers) => void;
}

/** Yes/no segmented control stored as a boolean. */
function YesNo({
  question,
  value,
  onChange,
}: {
  question: TypeQuestion;
  value: boolean | undefined;
  onChange: (value: boolean | undefined) => void;
}) {
  const pick = (v: boolean) => onChange(value === v ? undefined : v);
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => pick(true)}
        aria-pressed={value === true}
        className={cn(
          'flex cursor-pointer items-center gap-1.5 rounded-xl border-2 px-4 py-2 text-[13px] font-semibold transition-all',
          value === true
            ? 'border-brand-600 bg-brand-600 text-white shadow-sm shadow-brand-600/25'
            : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
        )}
      >
        {value === true && <Check size={14} strokeWidth={3} />}
        Yes
      </button>
      <button
        type="button"
        onClick={() => pick(false)}
        aria-pressed={value === false}
        className={cn(
          'flex cursor-pointer items-center gap-1.5 rounded-xl border-2 px-4 py-2 text-[13px] font-semibold transition-all',
          value === false
            ? 'border-slate-500 bg-slate-600 text-white shadow-sm'
            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
        )}
      >
        {value === false && <Check size={14} strokeWidth={3} />}
        No
      </button>
    </div>
  );
}

export default function TypeQuestions({ websiteType, answers, onChange }: TypeQuestionsProps) {
  const questions = getTypeQuestions(websiteType);
  if (questions.length === 0) return null;

  const toggleIn = (list: string[] | undefined, option: string): string[] => {
    const current = Array.isArray(list) ? list : [];
    return current.includes(option) ? current.filter((v) => v !== option) : [...current, option];
  };

  return (
    <div className="rounded-2xl border border-violet-200 bg-violet-50/40 p-5 dark:border-violet-500/30 dark:bg-violet-500/5">
      <div className="mb-4">
        <h3 className="text-[13px] font-bold uppercase tracking-wide text-violet-700 dark:text-violet-300">
          {websiteType} — specific requirements
        </h3>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          These answers shape the analysis, sitemap, blueprints and prototype — and appear in the brief and PDF.
        </p>
      </div>

      <div className="space-y-4">
        {questions.map((q) => {
          const value = answers?.[q.id];
          if (q.kind === 'yesno') {
            return (
              <div key={q.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{q.label}</span>
                <YesNo
                  question={q}
                  value={typeof value === 'boolean' ? value : undefined}
                  onChange={(v) => onChange({ [q.id]: v })}
                />
              </div>
            );
          }
          if (q.kind === 'multi') {
            const list = Array.isArray(value) ? value : [];
            return (
              <div key={q.id}>
                <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">{q.label}</p>
                <div className="flex flex-wrap gap-2">
                  {(q.options ?? []).map((option) => (
                    <Chip
                      key={option}
                      active={list.includes(option)}
                      onClick={() => onChange({ [q.id]: toggleIn(list, option) })}
                    >
                      {option}
                    </Chip>
                  ))}
                </div>
              </div>
            );
          }
          if (q.kind === 'textarea') {
            return (
              <Textarea
                key={q.id}
                label={q.label}
                value={typeof value === 'string' ? value : ''}
                onChange={(e) => onChange({ [q.id]: e.target.value })}
                placeholder={q.placeholder}
                className="min-h-[110px]"
              />
            );
          }
          return (
            <Input
              key={q.id}
              label={q.label}
              type="text"
              inputMode={q.kind === 'number' ? 'numeric' : undefined}
              value={typeof value === 'string' ? value : ''}
              onChange={(e) => onChange({ [q.id]: e.target.value })}
              placeholder={q.placeholder}
              hint={q.hint}
            />
          );
        })}
      </div>
    </div>
  );
}