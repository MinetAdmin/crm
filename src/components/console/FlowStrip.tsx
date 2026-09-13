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
    <nav aria-label="Funnel" className="mb-4 flex flex-wrap items-center gap-1 text-[13px]">
      {STEPS.map((step, index) => (
        <React.Fragment key={step.key}>
          {index > 0 && <ChevronRight className="size-3.5 text-(--c-muted)" aria-hidden />}
          <Link
            href={step.href}
            title={step.hint}
            aria-current={active === step.key ? "page" : undefined}
            className={`rounded-md border px-2.5 py-1 ${
              active === step.key
                ? "border-(--c-line) bg-(--c-surface) font-medium"
                : "border-transparent text-(--c-muted) hover:bg-(--c-wash)"
            }`}
          >
            {step.label} <span className="tabular-nums">{counts[step.key]}</span>
          </Link>
        </React.Fragment>
      ))}
      <ChevronRight className="size-3.5 text-(--c-muted)" aria-hidden />
      <span className="px-2.5 py-1 text-(--c-muted)" title="Won pursuits, all time">
        Won <span className="tabular-nums">{counts.won}</span>
      </span>
    </nav>
  );
}
