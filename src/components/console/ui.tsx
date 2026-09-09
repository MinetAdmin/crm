import Link from "next/link";

const PRIMARY =
  "inline-flex items-center rounded-full bg-(--c-brand) px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90";
const FIELD = "mt-1 w-full rounded-md border border-(--c-line) bg-(--c-surface) px-3 py-2 text-sm";

export function PrimaryButton({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <button type="submit" className={PRIMARY}>
      {children}
    </button>
  );
}

export function PrimaryLink({
  href,
  children,
}: Readonly<{ href: string; children: React.ReactNode }>) {
  return (
    <Link href={href} className={PRIMARY}>
      {children}
    </Link>
  );
}

export function BackLink({ href, children }: Readonly<{ href: string; children: React.ReactNode }>) {
  return (
    <Link href={href} className="text-sm text-(--c-muted) hover:underline">
      ← {children}
    </Link>
  );
}

export function TextField({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  autoFocus,
}: Readonly<{
  label: string;
  name: string;
  type?: "text" | "email" | "search";
  defaultValue?: string;
  required?: boolean;
  autoFocus?: boolean;
}>) {
  return (
    <label className="block text-sm">
      <span className="font-medium">{label}</span>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        required={required}
        autoFocus={autoFocus}
        className={FIELD}
      />
    </label>
  );
}

export function SelectField({
  label,
  name,
  defaultValue,
  options,
  emptyLabel = "Not set",
}: Readonly<{
  label: string;
  name: string;
  defaultValue?: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  emptyLabel?: string;
}>) {
  return (
    <label className="block text-sm">
      <span className="font-medium">{label}</span>
      <select name={name} defaultValue={defaultValue} className={FIELD}>
        <option value="">{emptyLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function CheckboxField({ label, name }: Readonly<{ label: string; name: string }>) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" name={name} className="size-4" />
      {label}
    </label>
  );
}

export function Notice({
  tone = "error",
  children,
}: Readonly<{ tone?: "error" | "warn"; children: React.ReactNode }>) {
  const edge = tone === "warn" ? "border-(--c-warn)" : "border-(--c-brand)";
  return (
    <div role="alert" className={`rounded-md border-l-2 ${edge} bg-(--c-wash) px-4 py-3 text-sm`}>
      {children}
    </div>
  );
}

export function EmptyState({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <p className="rounded-md border border-dashed border-(--c-line) p-8 text-center text-sm text-(--c-muted)">
      {children}
    </p>
  );
}
