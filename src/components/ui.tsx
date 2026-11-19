import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";
import type { UserRole } from "../api/types";

type Variant = "primary" | "secondary" | "danger";

/** Keyboard focus is visible everywhere, and only for keyboard users. */
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40";

const VARIANTS: Record<Variant, string> = {
  primary:
    "border border-indigo-600 bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-sm hover:to-indigo-700 disabled:border-slate-200 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:shadow-none",
  secondary:
    "border border-slate-300 bg-white text-slate-700 shadow-sm hover:border-slate-400 hover:bg-slate-50 disabled:border-slate-200 disabled:bg-white disabled:text-slate-400 disabled:shadow-none",
  danger:
    "border border-rose-600 bg-gradient-to-b from-rose-500 to-rose-600 text-white shadow-sm hover:to-rose-700 disabled:border-rose-200 disabled:from-rose-200 disabled:to-rose-200 disabled:shadow-none",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition duration-150 active:translate-y-px disabled:cursor-not-allowed disabled:active:translate-y-0 ${FOCUS} ${VARIANTS[variant]} ${className}`}
    />
  );
}

const CONTROL =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";

/** `hint` is a plain-language line under the control — where a field is not self-explanatory. */
export function Field({
  label,
  hint,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: ReactNode }) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="mb-1.5 block font-medium text-slate-700">{label}</span>
      <input {...props} className={CONTROL} />
      {hint && <span className="mt-1.5 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export function TextArea({
  label,
  hint,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-slate-700">{label}</span>
      <textarea {...props} rows={3} className={`${CONTROL} font-sans leading-relaxed`} />
      {hint && <span className="mt-1.5 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export function Select({
  label,
  hint,
  children,
  ...props
}: InputHTMLAttributes<HTMLSelectElement> & { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-slate-700">{label}</span>
      <select {...props} className={CONTROL}>
        {children}
      </select>
      {hint && <span className="mt-1.5 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export function Card({
  title,
  subtitle,
  actions,
  children,
}: {
  title?: string;
  /** One plain-language line saying what this screen means in the product, not how it is built. */
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5">
      {(title || actions) && (
        <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {title && (
              <h2 className="text-base font-semibold tracking-tight text-slate-900">{title}</h2>
            )}
            {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
          </div>
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}

export function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
      {message}
    </p>
  );
}

type Tone = "info" | "good" | "warn";

const TONES: Record<Tone, string> = {
  info: "border-sky-200 bg-sky-50 text-sky-900 marker:text-sky-300",
  good: "border-emerald-200 bg-emerald-50 text-emerald-900 marker:text-emerald-300",
  warn: "border-amber-200 bg-amber-50 text-amber-900 marker:text-amber-300",
};

/** A plain-language explanation of a rule or a permission — the "why this works this way" box. */
export function Callout({
  tone = "info",
  title,
  children,
  className = "",
}: {
  tone?: Tone;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-l-4 px-3.5 py-2.5 text-sm shadow-sm shadow-slate-900/[0.02] ${TONES[tone]} ${className}`}
    >
      {title && <p className="font-semibold">{title}</p>}
      <div className={title ? "mt-1" : ""}>{children}</div>
    </div>
  );
}

export function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-1 pl-4">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

export function RoleBadge({ role }: { role: UserRole }) {
  const tone =
    role === "admin"
      ? "bg-amber-50 text-amber-700 ring-amber-200"
      : "bg-slate-100 text-slate-600 ring-slate-200";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${tone}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${role === "admin" ? "bg-amber-500" : "bg-slate-400"}`} />
      {role === "admin" ? "Admin" : "User"}
    </span>
  );
}

/** Used for both "loading" and "nothing here yet" — same calm, dashed surface either way. */
export function Skeleton({ label }: { label: string }) {
  return (
    <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-3.5 py-5 text-center text-sm text-slate-500">
      {label}
    </p>
  );
}

/** The brand mark: a note glyph on the gradient tile used by the header and the sign-in hero. */
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`grid place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 text-white shadow-sm ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
        <path d="M8 9h8M8 13h5" />
      </svg>
    </span>
  );
}
