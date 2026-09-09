import * as React from "react";

import { CalendarDays, Plus } from "lucide-react";
import Link from "next/link";

import { HeaderActions } from "@/components/console/HeaderActions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getDashboardSummary } from "@/lib/dashboard";
import { pipelineByStage, type StageRow } from "@/lib/forecast";
import { formatCompactAmount } from "@/lib/format";
import { hygieneExceptions, type ExceptionRow } from "@/lib/reports";

export default async function ConsolePage() {
  const [summary, stages, exceptions] = await Promise.all([
    getDashboardSummary(),
    pipelineByStage(),
    hygieneExceptions(),
  ]);

  const stats: ReadonlyArray<StatProps> = [
    {
      label: "Open pursuits",
      value: String(summary.openPursuits),
      note: "Outcome still open",
    },
    {
      label: "Weighted pipeline",
      value: `UGX ${formatCompactAmount(summary.weightedPipeline)}`,
      note: "Expected times probability",
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

  const month = new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <>
      <HeaderActions>
        <Badge variant="outline" className="h-8 gap-1.5 px-3 text-[13px] font-medium">
          <CalendarDays className="size-3.5" />
          {month}
        </Badge>
        <Button asChild size="sm">
          <Link href="/console/leads/new">
            <Plus />
            New pursuit
          </Link>
        </Button>
      </HeaderActions>

      <StatStrip stats={stats} />

      <div className="mt-3 grid gap-3 lg:grid-cols-[5fr_7fr]">
        <StageCard stages={stages} />
        <AttentionCard exceptions={exceptions} />
      </div>
    </>
  );
}

type StatProps = {
  label: string;
  value: string;
  note: string;
  tone?: "plain" | "warn";
};

function StatStrip({ stats }: Readonly<{ stats: ReadonlyArray<StatProps> }>) {
  return (
    <Card className="rounded-lg py-0">
      <dl className="flex flex-col sm:flex-row">
        {stats.map((stat, index) => (
          <React.Fragment key={stat.label}>
            {index > 0 && (
              <Separator orientation="vertical" className="hidden data-vertical:my-3 sm:block" />
            )}
            {index > 0 && <Separator className="sm:hidden" />}
            <Stat {...stat} />
          </React.Fragment>
        ))}
      </dl>
    </Card>
  );
}

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

function StageCard({ stages }: Readonly<{ stages: StageRow[] }>) {
  const max = Math.max(...stages.map((s) => s.count), 1);
  const floor = 0.45;

  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle className="font-sans text-sm font-semibold">
          Open pursuits by stage
        </CardTitle>
        <CardAction>
          <Link
            href="/console/opportunities"
            className="text-[13px] text-muted-foreground hover:text-foreground"
          >
            View pipeline
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent>
        {stages.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">
            No open pursuits yet — the pipeline starts with a lead.
          </p>
        ) : (
          stages.map((stage, index) => (
            <div
              key={stage.stage}
              className="grid grid-cols-[130px_1fr_48px] items-center gap-2.5 py-1"
            >
              <span
                className="truncate text-[12.5px] text-muted-foreground"
                title={stage.stage}
              >
                {stage.stage}
              </span>
              <div
                className="h-4 rounded-r-sm bg-(--chart-4)"
                style={{
                  width: `${(stage.count / max) * 100}%`,
                  opacity:
                    stages.length > 1
                      ? floor + (1 - floor) * (index / (stages.length - 1))
                      : 1,
                }}
              />
              <span className="text-right text-[12.5px] font-semibold tabular-nums">
                {stage.count}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

const SEVERE = new Set(["Action overdue", "Close date passed"]);

function AttentionCard({
  exceptions,
}: Readonly<{ exceptions: ExceptionRow[] }>) {
  const shown = exceptions.slice(0, 5);

  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle className="font-sans text-sm font-semibold">
          Needs attention
        </CardTitle>
        <CardAction>
          <Link
            href="/console/reports"
            className="text-[13px] text-muted-foreground hover:text-foreground"
          >
            View all {exceptions.length}
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent>
        {shown.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">
            Nothing needs attention right now.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-0">Pursuit</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead className="pr-0">Issue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="pl-0 font-medium">
                    <Link
                      href={`/console/opportunities/${row.id}`}
                      className="hover:underline"
                    >
                      {row.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.owner}
                  </TableCell>
                  <TableCell className="pr-0">
                    <IssuePills reasons={row.reasons} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function IssuePills({ reasons }: Readonly<{ reasons: string[] }>) {
  const [first, ...rest] = reasons;
  if (!first) return null;
  const severe = SEVERE.has(first);

  return (
    <span className="flex items-center gap-1.5">
      <Badge
        className={
          severe
            ? "gap-1.5 bg-(--c-brand)/10 text-(--c-brand)"
            : "gap-1.5 bg-(--c-warn)/10 text-(--c-warn)"
        }
      >
        <span className="size-1.5 rounded-full bg-current" />
        {first}
      </Badge>
      {rest.length > 0 && (
        <span className="text-xs text-muted-foreground">+{rest.length}</span>
      )}
    </span>
  );
}
