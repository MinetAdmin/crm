import * as React from "react";

import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getDashboardSummary } from "@/lib/dashboard";
import { formatAmount } from "@/lib/format";

export default async function ConsolePage() {
  const summary = await getDashboardSummary();

  const stats: ReadonlyArray<StatProps> = [
    {
      label: "Open pursuits",
      value: String(summary.openPursuits),
      note: "Outcome still open",
    },
    {
      label: "Weighted pipeline",
      value: formatAmount(summary.weightedPipeline),
      note: "UGX, expected times probability",
    },
    {
      label: "Needs attention",
      value: String(summary.exceptions),
      note: "No next action, overdue, stale or unpriced",
      tone: summary.exceptions > 0 ? "warn" : "plain",
    },
    {
      label: "Tender deadlines",
      value: String(summary.tendersDue),
      note: "Closing within 30 days",
      tone: summary.tendersDue > 0 ? "warn" : "plain",
    },
  ];

  return (
    <Card className="rounded-lg py-0">
      <dl className="flex flex-col sm:flex-row">
        {stats.map((stat, index) => (
          <React.Fragment key={stat.label}>
            {index > 0 && (
              <Separator
                orientation="vertical"
                className="hidden data-vertical:my-3 sm:block"
              />
            )}
            {index > 0 && <Separator className="sm:hidden" />}
            <Stat {...stat} />
          </React.Fragment>
        ))}
      </dl>
    </Card>
  );
}

type StatProps = {
  label: string;
  value: string;
  note: string;
  tone?: "plain" | "warn";
};

function Stat({ label, value, note, tone = "plain" }: Readonly<StatProps>) {
  return (
    <div className="flex-1 px-4 py-3.5">
      <dt className="text-[13px] text-muted-foreground">{label}</dt>
      <dd
        className={`mt-1.5 text-2xl font-semibold tracking-[-0.02em] ${
          tone === "warn" ? "text-(--c-warn)" : ""
        }`}
      >
        {value}
      </dd>
      <p className="mt-1 text-xs leading-snug text-muted-foreground">{note}</p>
    </div>
  );
}
