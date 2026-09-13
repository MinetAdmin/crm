import Link from "next/link";

import { Button } from "@/components/ui/button";

export function PrimaryButton({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <Button type="submit" size="sm">
      {children}
    </Button>
  );
}

export function PrimaryLink({
  href,
  children,
}: Readonly<{ href: string; children: React.ReactNode }>) {
  return (
    <Button asChild size="sm">
      <Link href={href}>{children}</Link>
    </Button>
  );
}

export function BackLink({ href, children }: Readonly<{ href: string; children: React.ReactNode }>) {
  return (
    <Link href={href} className="text-sm text-(--c-muted) hover:underline">
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

export function EmptyState({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <p className="rounded-md border border-dashed border-(--c-line) p-8 text-center text-sm text-(--c-muted)">
      {children}
    </p>
  );
}
