import { AlertCircle } from 'lucide-react';
import type { ReactNode, SelectHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '../lib/utils';

interface BaseProps {
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
}

export function FieldLabel({
  label,
  required,
  htmlFor,
}: {
  label?: string;
  required?: boolean;
  htmlFor?: string;
}) {
  if (!label) return null;
  return (
    <label htmlFor={htmlFor} className="label">
      {label} {required && <span className="label-required">*</span>}
    </label>
  );
}

export function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p className="field-error" role="alert">
      <AlertCircle size={13} />
      {error}
    </p>
  );
}

export function FieldHint({ hint }: { hint?: string }) {
  if (!hint) return null;
  return <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">{hint}</p>;
}

export function Field({
  label,
  required,
  error,
  hint,
  htmlFor,
  children,
}: BaseProps & { htmlFor?: string; children: ReactNode }) {
  return (
    <div>
      <FieldLabel label={label} required={required} htmlFor={htmlFor} />
      {children}
      <FieldError error={error} />
      {!error && <FieldHint hint={hint} />}
    </div>
  );
}

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  inputSize?: 'md' | 'lg';
}

export function Input({
  label,
  error,
  hint,
  required,
  className,
  id,
  inputSize = 'md',
  ...rest
}: InputProps) {
  const autoId = id ?? rest.name;
  return (
    <div>
      <FieldLabel label={label} required={required} htmlFor={autoId} />
      <input
        id={autoId}
        className={cn(
          'input',
          error && 'input-error',
          inputSize === 'lg' && 'px-4 py-3 text-[15px]',
          className
        )}
        aria-invalid={!!error}
        {...rest}
      />
      <FieldError error={error} />
      {!error && <FieldHint hint={hint} />}
    </div>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Select({ label, error, hint, required, className, id, children, ...rest }: SelectProps) {
  const autoId = id ?? rest.name;
  return (
    <div>
      <FieldLabel label={label} required={required} htmlFor={autoId} />
      <div className="relative">
        <select
          id={autoId}
          className={cn('input appearance-none pr-9', error && 'input-error', className)}
          aria-invalid={!!error}
          {...rest}
        >
          {children}
        </select>
        <svg
          className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
      <FieldError error={error} />
      {!error && <FieldHint hint={hint} />}
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Textarea({ label, error, hint, required, className, id, ...rest }: TextareaProps) {
  const autoId = id ?? rest.name;
  return (
    <div>
      <FieldLabel label={label} required={required} htmlFor={autoId} />
      <textarea
        id={autoId}
        className={cn('input min-h-[110px] resize-y leading-relaxed', error && 'input-error', className)}
        aria-invalid={!!error}
        {...rest}
      />
      <FieldError error={error} />
      {!error && <FieldHint hint={hint} />}
    </div>
  );
}

/* ---------------- Chip (toggleable) ---------------- */

interface ChipProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  title?: string;
}

export function Chip({ active, onClick, children, title }: ChipProps) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      aria-pressed={active}
      className={cn('chip', active && 'chip-active')}
    >
      {active && (
        <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 shrink-0" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      )}
      {children}
    </button>
  );
}