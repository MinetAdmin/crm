import { getDashboardSummary } from "@/lib/dashboard";
import { formatAmount } from "@/lib/format";

export default async function ConsolePage() {
  const summary = await getDashboardSummary();

  return (
    <div className="w-full">
      <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Tile label="Open pursuits" value={String(summary.openPursuits)} note="Outcome still open" />
        <Tile
          label="Weighted pipeline"
          value={formatAmount(summary.weightedPipeline)}
          note="UGX, expected times probability"
        />
        <Tile
          label="Needs attention"
          value={String(summary.exceptions)}
          note="No next action, overdue, stale or unpriced"
          tone={summary.exceptions > 0 ? "warn" : "plain"}
        />
        <Tile
          label="Tender deadlines"
          value={String(summary.tendersDue)}
          note="Closing within 30 days"
          tone={summary.tendersDue > 0 ? "warn" : "plain"}
        />
      </dl>
    </div>
  );
}

function Tile({
  label,
  value,
  note,
  tone = "plain",
}: Readonly<{
  label: string;
  value: string;
  note: string;
  tone?: "plain" | "warn";
}>) {
  return (
    <div className="rounded-md border border-(--c-line) bg-(--c-surface) p-4">
      <dt className="text-[13px] text-(--c-muted)">{label}</dt>
      <dd
        className={`mt-1.5 text-2xl font-semibold tracking-[-0.02em] tabular-nums ${
          tone === "warn" ? "text-(--c-warn)" : ""
        }`}
      >
        {value}
      </dd>
      <p className="mt-1 text-[12px] leading-snug text-(--c-muted)">{note}</p>
    </div>
  );
}
