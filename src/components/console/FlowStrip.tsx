import Link from "next/link";

import type { FunnelCounts } from "@/lib/funnel";

const STEPS = [
  { key: "longlist", label: "Longlist", href: "/console/longlist", hint: "Names waiting" },
  { key: "leads", label: "Leads", href: "/console/leads", hint: "Open leads" },
  { key: "pipeline", label: "Pipeline", href: "/console/opportunities", hint: "Open pursuits" },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

/** The funnel as a tab strip: longlist, leads, and pipeline, with counts. */
export function FlowStrip({
  counts,
  active,
}: Readonly<{ counts: FunnelCounts; active: StepKey }>) {
  return (
    <nav
      aria-label="Funnel"
      className="flex shrink-0 items-center gap-4 border-b border-border px-4 md:px-6"
    >
      {STEPS.map((step) => (
        <Link
          key={step.key}
          href={step.href}
          title={step.hint}
          aria-current={active === step.key ? "page" : undefined}
          className={`-mb-px inline-flex items-center gap-1.5 border-b py-3 text-sm leading-none transition-colors duration-150 ease-(--ease-out-strong) ${
            active === step.key
              ? "border-foreground font-medium text-foreground"
              : "border-transparent text-(--subtle) hover:text-(--soft)"
          }`}
        >
          {step.label}
          <CountChip value={counts[step.key]} />
        </Link>
      ))}
      <span
        className="ml-auto inline-flex items-center gap-1.5 py-3 text-sm leading-none text-(--subtle)"
        title="Won pursuits, all time"
      >
        Won
        <CountChip value={counts.won} />
      </span>
    </nav>
  );
}

export function CountChip({ value }: Readonly<{ value: number }>) {
  return (
    <span className="inline-flex h-4 min-w-6 shrink-0 items-center justify-center rounded-full border border-(--faint)/50 bg-muted px-1 text-[11px] leading-none text-(--chip) tabular-nums">
      {value}
    </span>
  );
}
