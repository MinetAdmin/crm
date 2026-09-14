import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "cn";

export const pillClass =
  "h-[30px] rounded-full border-transparent bg-secondary px-3 text-xs font-medium text-secondary-foreground shadow-(--pill-shadow) transition-[background-color,color,box-shadow,scale] duration-150 ease-(--ease-out-strong) hover:bg-muted active:translate-y-0 active:scale-[0.96]";

export const pillPrimaryClass =
  "h-[30px] rounded-full border-transparent px-3 text-xs font-medium shadow-(--pill-shadow-primary) transition-[background-color,color,box-shadow,scale] duration-150 ease-(--ease-out-strong) active:translate-y-0 active:scale-[0.96]";

export function PrimaryButton({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <Button type="submit" size="sm" className={pillPrimaryClass}>
      {children}
    </Button>
  );
}

export function PrimaryLink({
  href,
  children,
}: Readonly<{ href: string; children: React.ReactNode }>) {
  return (
    <Button asChild size="sm" className={pillPrimaryClass}>
      <Link href={href}>{children}</Link>
    </Button>
  );
}

export function BackLink({ href, children }: Readonly<{ href: string; children: React.ReactNode }>) {
  return (
    <Link
      href={href}
      className="text-sm text-(--c-muted) transition-colors duration-150 hover:text-foreground"
    >
      ← {children}
    </Link>
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

export function EmptyState({
  className,
  children,
}: Readonly<{ className?: string; children: React.ReactNode }>) {
  return (
    <p
      className={cn(
        "grid place-content-center rounded-md border border-dashed border-(--c-line) p-8 text-center text-sm text-(--c-muted)",
        className,
      )}
    >
      {children}
    </p>
  );
}

export type TagTone =
  | "blue"
  | "purple"
  | "green"
  | "moss"
  | "red"
  | "orange"
  | "amber"
  | "teal"
  | "yellow"
  | "neutral";

const TAG_CLASSES: Record<TagTone, string> = {
  blue: "border-(--tag-blue-border) bg-(--tag-blue-bg) text-(--tag-blue-text)",
  purple: "border-(--tag-purple-border) bg-(--tag-purple-bg) text-(--tag-purple-text)",
  green: "border-(--tag-green-border) bg-(--tag-green-bg) text-(--tag-green-text)",
  moss: "border-(--tag-moss-border) bg-(--tag-moss-bg) text-(--tag-moss-text)",
  red: "border-(--tag-red-border) bg-(--tag-red-bg) text-(--tag-red-text)",
  orange: "border-(--tag-orange-border) bg-(--tag-orange-bg) text-(--tag-orange-text)",
  amber: "border-(--tag-amber-border) bg-(--tag-amber-bg) text-(--tag-amber-text)",
  teal: "border-(--tag-teal-border) bg-(--tag-teal-bg) text-(--tag-teal-text)",
  yellow: "border-(--tag-yellow-border) bg-(--tag-yellow-bg) text-(--tag-yellow-text)",
  neutral: "border-(--tag-neutral-border) bg-(--tag-neutral-bg) text-(--tag-neutral-text)",
};

const HASH_TONES: ReadonlyArray<TagTone> = [
  "blue",
  "purple",
  "green",
  "moss",
  "orange",
  "amber",
  "teal",
  "yellow",
];

export function leadStatusTone(status: string): TagTone {
  switch (status) {
    case "new":
      return "blue";
    case "contacted":
      return "teal";
    case "qualifying":
      return "amber";
    case "qualified":
      return "green";
    default:
      return "neutral";
  }
}

export function outcomeTone(outcome: string): TagTone {
  switch (outcome) {
    case "won":
      return "green";
    case "lost":
      return "red";
    case "on_hold":
      return "amber";
    default:
      return "neutral";
  }
}

export function tagToneFor(code: string): TagTone {
  let hash = 0;
  for (const char of code) hash = (hash * 31 + char.codePointAt(0)!) % 997;
  return HASH_TONES[hash % HASH_TONES.length];
}

export function TagPill({
  tone = "neutral",
  className,
  children,
}: Readonly<{ tone?: TagTone; className?: string; children: React.ReactNode }>) {
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center justify-center rounded-full border px-2 text-xs leading-none whitespace-nowrap",
        TAG_CLASSES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
