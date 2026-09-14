"use client";

import * as React from "react";

import { CalendarDays } from "lucide-react";
import Link from "next/link";

import { getOpportunityPanel, type OpportunityPanel } from "@/app/console/actions";
import { PanelSection, StatTile } from "@/components/console/panel";
import { outcomeTone, pillClass, pillPrimaryClass, TagPill, tagToneFor } from "@/components/console/ui";
import { ProbabilityMeter } from "@/components/console/viz";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { winProbability } from "@/lib/account-table";
import { formatAmount, formatShortDate } from "@/lib/format";

type Target = { id: string; name: string };

export function OpportunityDetailSheet({
  target,
  onClose,
}: Readonly<{ target: Target | null; onClose: () => void }>) {
  const [loaded, setLoaded] = React.useState<{
    id: string;
    panel: OpportunityPanel | null;
  } | null>(null);

  React.useEffect(() => {
    if (!target || loaded?.id === target.id) return;
    let stale = false;
    getOpportunityPanel(target.id)
      .then((panel) => {
        if (!stale) setLoaded({ id: target.id, panel });
      })
      .catch(() => {
        if (!stale) setLoaded({ id: target.id, panel: null });
      });
    return () => {
      stale = true;
    };
  }, [target, loaded]);

  if (!target) return null;
  const panel = loaded?.id === target.id ? loaded.panel : null;
  const pending = loaded?.id !== target.id;

  return (
    <Sheet open onOpenChange={(next) => !next && onClose()}>
      <SheetContent className="w-full gap-0 data-[side=right]:sm:max-w-md">
        <SheetHeader className="gap-1 border-b border-border pr-12">
          <SheetTitle className="text-[16px] leading-none font-medium">
            Pursuit detail
          </SheetTitle>
          <SheetDescription className="text-xs">
            {panel
              ? `Closes ${formatShortDate(panel.expectedCloseDate)} · ${panel.closeConfidence}`
              : "Summary of the pursuit and its schedule."}
          </SheetDescription>
        </SheetHeader>

        <div className="grid flex-1 content-start gap-4 overflow-y-auto p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[16px] leading-none font-medium">{target.name}</span>
            {panel && (
              <span className="flex items-center gap-1">
                <TagPill tone={tagToneFor(panel.stageCode)}>{panel.stage}</TagPill>
                {panel.outcome !== "open" && (
                  <TagPill tone={outcomeTone(panel.outcome)}>{panel.outcome}</TagPill>
                )}
              </span>
            )}
          </div>

          {pending && <PanelSkeleton />}
          {!pending && !panel && (
            <p className="text-sm text-(--c-muted)">Could not load this pursuit.</p>
          )}
          {panel && <PanelContent panel={panel} onNavigate={onClose} />}
        </div>

        <SheetFooter className="flex-row items-center justify-end gap-2 border-t border-border">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className={pillClass}
            onClick={onClose}
          >
            Close
          </Button>
          <Button asChild size="sm" className={pillPrimaryClass}>
            <a href={`/console/opportunities/${target.id}`}>Open full record</a>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function PanelSkeleton() {
  return (
    <div className="grid gap-4">
      <Skeleton className="h-5 w-56" />
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-[62px] rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-5 w-40" />
    </div>
  );
}

function PanelContent({
  panel,
  onNavigate,
}: Readonly<{ panel: OpportunityPanel; onNavigate: () => void }>) {
  const probability =
    panel.expected > 0
      ? winProbability(panel.weighted, panel.expected)
      : Math.round(panel.probability);

  return (
    <>
      <PanelSection title="Account">
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <Link
            href={`/console/accounts/${panel.account.id}`}
            onClick={onNavigate}
            className="font-medium underline-offset-2 hover:underline"
          >
            {panel.account.name}
          </Link>
          <span className="text-(--c-muted)">Owner {panel.owner}</span>
        </span>
        {panel.keyBlocker && (
          <p className="text-sm text-(--c-warn)">Blocker: {panel.keyBlocker}</p>
        )}
      </PanelSection>

      <PanelSection title="Money">
        {probability !== null && (
          <>
            <p className="text-2xl leading-none font-medium tabular-nums">{probability}%</p>
            <p className="text-xs text-muted-foreground">Win probability</p>
            <ProbabilityMeter value={probability} segments={36} className="w-full" />
          </>
        )}
        <div className="mt-1 grid grid-cols-2 gap-2">
          <StatTile label="Expected UGX" value={formatAmount(panel.expected)} />
          <StatTile label="Weighted UGX" value={formatAmount(panel.weighted)} />
          <StatTile label="Close date" value={formatShortDate(panel.expectedCloseDate)} />
          <StatTile
            label="Forecast"
            value={panel.forecastCategory?.replaceAll("_", " ") ?? "Not set"}
          />
        </div>
      </PanelSection>

      <PanelSection title={`Schedule (${panel.schedule.length})`}>
        {panel.schedule.length === 0 ? (
          <p className="text-sm text-(--c-muted)">No revenue schedule lines yet.</p>
        ) : (
          <ul className="grid gap-1">
            {panel.schedule.map((line) => (
              <li
                key={line.id}
                className="flex items-center justify-between gap-3 text-sm leading-snug"
              >
                <span className="min-w-0 truncate">
                  <span className="tabular-nums">{line.month}</span>
                  <span className="text-(--c-muted)"> · {line.product}</span>
                </span>
                <span className="shrink-0 tabular-nums">{formatAmount(line.expected)}</span>
              </li>
            ))}
          </ul>
        )}
      </PanelSection>

      <PanelSection title="Movement">
        {panel.history.length === 0 ? (
          <p className="text-sm text-(--c-muted)">No stage movements yet.</p>
        ) : (
          <ul className="grid gap-2">
            {panel.history.map((move) => (
              <li key={move.id} className="grid gap-1 text-sm leading-snug">
                <span>
                  <span className="font-medium">{move.actor}</span> moved to {move.stage}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarDays className="size-3" aria-hidden />
                  {formatShortDate(move.changedAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </PanelSection>
    </>
  );
}

