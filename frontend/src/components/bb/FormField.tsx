import { type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';

interface FormFieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({ label, required, hint, children, className = '' }: FormFieldProps) {
  return (
    <div className={className}>
      <label className="block text-[11px] font-mono font-semibold uppercase tracking-widest text-ink-3 mb-1.5">
        {label}
        {required && <span className="text-cream ml-1">*</span>}
      </label>
      {children}
      {hint && (
        <p className="text-[11px] font-mono text-ink-3 mt-1.5">{hint}</p>
      )}
    </div>
  );
}

export function FormInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-3 py-2.5 bg-surface-2 border border-line text-ink text-sm font-mono focus:border-cream ${props.className || ''}`}
    />
  );
}

export function FormTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full px-3 py-2.5 bg-surface-2 border border-line text-ink text-sm font-mono focus:border-cream resize-y ${props.className || ''}`}
    />
  );
}
