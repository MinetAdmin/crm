import * as React from "react";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

import type { FunnelCounts } from "@/lib/funnel";

const STEPS = [
  { key: "longlist", label: "Longlist", href: "/console/longlist", hint: "Names waiting" },
  { key: "leads", label: "Leads", href: "/console/leads", hint: "Open leads" },
  { key: "pipeline", label: "Pipeline", href: "/console/opportunities", hint: "Open pursuits" },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

/** The funnel in one line: longlist to leads to pipeline to won, with counts. */
export function FlowStrip({
  counts,
  active,
}: Readonly<{ counts: FunnelCounts; active: StepKey }>) {
  return (
    <nav aria-label="Funnel" className="flex flex-wrap items-center gap-1 text-xs">
      {STEPS.map((step, index) => (
        <React.Fragment key={step.key}>
          {index > 0 && <ChevronRight className="size-3 text-(--faint)" aria-hidden />}
          <Link
            href={step.href}
            title={step.hint}
            aria-current={active === step.key ? "page" : undefined}
            className={`inline-flex h-[30px] items-center gap-1.5 rounded-full px-3 transition-[background-color,color,box-shadow] duration-150 ease-(--ease-out-strong) ${
              active === step.key
                ? "bg-secondary font-medium text-foreground shadow-(--pill-shadow)"
                : "text-(--subtle) hover:bg-muted hover:text-foreground"
            }`}
          >
            {step.label}
            <CountChip value={counts[step.key]} />
          </Link>
        </React.Fragment>
      ))}
      <ChevronRight className="size-3 text-(--faint)" aria-hidden />
      <span
        className="inline-flex h-[30px] items-center gap-1.5 px-3 text-(--subtle)"
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
