"use client";

import * as React from "react";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { UserSheet } from "@/components/console/ProfileSheet";
import { TagPill, tagToneFor } from "@/components/console/ui";
import { ProbabilityMeter } from "@/components/console/viz";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { winProbability } from "@/lib/account-table";
import { formatAmount, formatShortDate } from "@/lib/format";
import type { OpportunityRow } from "@/lib/opportunities";

import { OpportunityDetailSheet, outcomeTone } from "./OpportunityDetailSheet";

export type OpportunitySummary = {
  count: number;
  expected: number;
  weighted: number;
  avgWin: number | null;
};

export function OpportunitiesTable({
  opportunities,
  summary,
}: Readonly<{ opportunities: ReadonlyArray<OpportunityRow>; summary: OpportunitySummary }>) {
  const [selected, setSelected] = React.useState<ReadonlySet<string>>(new Set());
  const [owner, setOwner] = React.useState<{ id: string; name: string } | null>(null);
  const [detail, setDetail] = React.useState<{ id: string; name: string } | null>(null);
  const allSelected = opportunities.length > 0 && selected.size === opportunities.length;
  const headerState: boolean | "indeterminate" = allSelected
    ? true
    : selected.size > 0
      ? "indeterminate"
      : false;

  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(opportunities.map((o) => o.id)));
  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-auto border-y border-border">
        <Table className="text-sm leading-none [&_td]:h-[42px] [&_td]:px-3 [&_td]:py-0 [&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:h-[38px] [&_th]:border-b [&_th]:border-border [&_th]:bg-background [&_th]:px-3">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <HeadCell>
                <span className="flex items-center gap-3">
                  <Checkbox
                    checked={headerState}
                    onCheckedChange={toggleAll}
                    aria-label="Select all pursuits"
                  />
                  Pursuit
                </span>
              </HeadCell>
              <HeadCell>Account</HeadCell>
              <HeadCell>Stage</HeadCell>
              <HeadCell>Owner</HeadCell>
              <HeadCell align="right">Expected (UGX)</HeadCell>
              <HeadCell align="right">Weighted (UGX)</HeadCell>
              <HeadCell align="right">Win probability</HeadCell>
              <HeadCell>Close</HeadCell>
              <HeadCell>
                <span className="sr-only">Actions</span>
              </HeadCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {opportunities.map((opportunity) => (
              <OpportunityTableRow
                key={opportunity.id}
                opportunity={opportunity}
                selected={selected.has(opportunity.id)}
                onToggle={() => toggleOne(opportunity.id)}
                onOwnerClick={setOwner}
                onOpen={() => setDetail({ id: opportunity.id, name: opportunity.name })}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid shrink-0 grid-cols-2 gap-px border-b border-border bg-background p-px text-xs sm:grid-cols-4">
        <SummaryCell>
          <span className="text-foreground tabular-nums">
            {selected.size > 0 ? selected.size : summary.count}
          </span>
          <span className="text-muted-foreground">
            {selected.size > 0 ? "selected" : "pursuits in view"}
          </span>
        </SummaryCell>
        <SummaryCell>
          <span className="text-foreground tabular-nums">{formatAmount(summary.expected)}</span>
          <span className="text-muted-foreground">expected UGX</span>
        </SummaryCell>
        <SummaryCell>
          <span className="text-foreground tabular-nums">{formatAmount(summary.weighted)}</span>
          <span className="text-muted-foreground">weighted UGX</span>
        </SummaryCell>
        <SummaryCell>
          <span className="text-foreground tabular-nums">
            {summary.avgWin === null ? "n/a" : `${summary.avgWin}%`}
          </span>
          <span className="text-muted-foreground">avg win</span>
        </SummaryCell>
      </div>

      <UserSheet owner={owner} onClose={() => setOwner(null)} />
      <OpportunityDetailSheet target={detail} onClose={() => setDetail(null)} />
    </div>
  );
}

const HEAD_ALIGN = { right: "text-right", center: "text-center" } as const;

function HeadCell({
  align,
  children,
}: Readonly<{ align?: keyof typeof HEAD_ALIGN; children: React.ReactNode }>) {
  return (
    <TableHead
      className={`text-xs font-normal whitespace-nowrap text-(--subtle) ${
        align ? HEAD_ALIGN[align] : ""
      }`}
    >
      {children}
    </TableHead>
  );
}

function SummaryCell({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="flex items-center gap-2 p-3 outline-1 outline-border">{children}</div>;
}

function OpportunityTableRow({
  opportunity,
  selected,
  onToggle,
  onOwnerClick,
  onOpen,
}: Readonly<{
  opportunity: OpportunityRow;
  selected: boolean;
  onToggle: () => void;
  onOwnerClick: (owner: { id: string; name: string }) => void;
  onOpen: () => void;
}>) {
  const probability =
    opportunity.expected > 0
      ? winProbability(opportunity.weighted, opportunity.expected)
      : Math.round(opportunity.probability);
  const openRow = (event: React.MouseEvent<HTMLTableRowElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("a,button,input,label,[role=checkbox]")) return;
    onOpen();
  };

  return (
    <TableRow
      data-state={selected ? "selected" : undefined}
      onClick={openRow}
      className="cursor-pointer transition-colors duration-150 ease-(--ease-out-strong) hover:bg-card/60 data-[state=selected]:bg-card"
    >
      <TableCell>
        <span className="flex items-center gap-3">
          <Checkbox
            checked={selected}
            onCheckedChange={onToggle}
            aria-label={`Select ${opportunity.name}`}
          />
          <button
            type="button"
            onClick={onOpen}
            className="cursor-pointer font-medium underline-offset-2 hover:underline"
          >
            {opportunity.name}
          </button>
        </span>
      </TableCell>
      <TableCell>
        <Link
          href={`/console/accounts/${opportunity.account.id}`}
          className="text-(--c-muted) underline-offset-2 hover:text-foreground hover:underline"
        >
          {opportunity.account.name}
        </Link>
      </TableCell>
      <TableCell>
        <span className="flex items-center gap-1">
          <TagPill tone={tagToneFor(opportunity.stageCode)}>{opportunity.stage}</TagPill>
          {opportunity.outcome !== "open" && (
            <TagPill tone={outcomeTone(opportunity.outcome)}>{opportunity.outcome}</TagPill>
          )}
        </span>
      </TableCell>
      <TableCell>
        <button
          type="button"
          onClick={() => onOwnerClick(opportunity.owner)}
          aria-label={`Open profile for ${opportunity.owner.name}`}
          className="-mx-1.5 inline-flex cursor-pointer items-center gap-1.5 rounded-full px-1.5 py-1 transition-colors duration-150 ease-(--ease-out-strong) hover:bg-foreground/6"
        >
          <span
            aria-hidden
            className="grid size-5 shrink-0 place-items-center rounded-full bg-muted text-[9px] font-medium text-(--chip) outline-1 -outline-offset-1 outline-white/10"
          >
            {initialsOf(opportunity.owner.name)}
          </span>
          {opportunity.owner.name}
        </button>
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {opportunity.expected > 0 ? (
          formatAmount(opportunity.expected)
        ) : (
          <Empty>0</Empty>
        )}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {opportunity.weighted > 0 ? (
          <span className="inline-flex items-center gap-1">
            <span className="text-muted-foreground">UGX</span>
            {formatAmount(opportunity.weighted)}
          </span>
        ) : (
          <Empty>0</Empty>
        )}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {probability === null ? (
          <Empty>n/a</Empty>
        ) : (
          <span className="inline-flex items-center gap-2">
            <ProbabilityMeter value={probability} />
            <span className="w-[4ch] text-right">{probability}%</span>
          </span>
        )}
      </TableCell>
      <TableCell className="tabular-nums">
        {formatShortDate(opportunity.expectedCloseDate)}
      </TableCell>
      <TableCell>
        <Link
          href={`/console/opportunities/${opportunity.id}`}
          aria-label={`Open the full record for ${opportunity.name}`}
          title="Open full record"
          className="inline-flex size-6 items-center justify-center rounded-full transition-colors duration-150 hover:bg-foreground/6"
        >
          <ArrowUpRight className="size-3" aria-hidden />
        </Link>
      </TableCell>
    </TableRow>
  );
}

function Empty({ children }: Readonly<{ children: React.ReactNode }>) {
  return <span className="text-(--c-muted)">{children}</span>;
}

function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/);
  const first = words[0]?.[0] ?? "";
  const second = words.length > 1 ? (words[1][0] ?? "") : "";
  return (first + second).toUpperCase();
}
