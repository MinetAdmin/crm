"use client";

import * as React from "react";

import { CalendarDays, Ellipsis } from "lucide-react";
import Link from "next/link";

import { TagPill, tagToneFor } from "@/components/console/ui";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AccountRow, AccountSummary } from "@/lib/account-table";
import { formatAmount } from "@/lib/format";

export function AccountsTable({
  accounts,
  summary,
}: Readonly<{ accounts: ReadonlyArray<AccountRow>; summary: AccountSummary }>) {
  const [selected, setSelected] = React.useState<ReadonlySet<string>>(new Set());
  const allSelected = accounts.length > 0 && selected.size === accounts.length;
  const headerState: boolean | "indeterminate" = allSelected
    ? true
    : selected.size > 0
      ? "indeterminate"
      : false;

  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(accounts.map((account) => account.id)));
  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div>
      <div className="overflow-x-auto border-y border-border">
        <Table className="text-sm leading-none [&_td]:h-[42px] [&_td]:px-3 [&_td]:py-0 [&_th]:h-[38px] [&_th]:px-3">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <HeadCell>
                <span className="flex items-center gap-3">
                  <Checkbox
                    checked={headerState}
                    onCheckedChange={toggleAll}
                    aria-label="Select all accounts"
                  />
                  Account
                </span>
              </HeadCell>
              <HeadCell>Sector &amp; Unit</HeadCell>
              <HeadCell align="right">Contacts</HeadCell>
              <HeadCell>Decision maker</HeadCell>
              <HeadCell align="right">Open leads</HeadCell>
              <HeadCell align="right">Open pursuits</HeadCell>
              <HeadCell align="right">Weighted (UGX)</HeadCell>
              <HeadCell align="right">Win probability</HeadCell>
              <HeadCell>Last movement</HeadCell>
              <HeadCell>Created</HeadCell>
              <HeadCell>
                <span className="sr-only">Actions</span>
              </HeadCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((account) => (
              <AccountTableRow
                key={account.id}
                account={account}
                selected={selected.has(account.id)}
                onToggle={() => toggleOne(account.id)}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid grid-cols-2 gap-px border-b border-border bg-background p-px text-xs sm:grid-cols-4">
        <SummaryCell>
          <span className="text-foreground tabular-nums">
            {selected.size > 0 ? selected.size : summary.accounts}
          </span>
          <span className="text-muted-foreground">
            {selected.size > 0 ? "selected" : "accounts in view"}
          </span>
        </SummaryCell>
        <SummaryCell>
          <span className="text-foreground tabular-nums">{formatAmount(summary.weighted)}</span>
          <span className="text-muted-foreground">weighted UGX</span>
        </SummaryCell>
        <SummaryCell>
          <span className="text-foreground tabular-nums">{summary.openPursuits}</span>
          <span className="text-muted-foreground">open pursuits</span>
        </SummaryCell>
        <SummaryCell>
          <span className="text-foreground tabular-nums">{summary.openLeads}</span>
          <span className="text-muted-foreground">open leads</span>
        </SummaryCell>
      </div>
    </div>
  );
}

function HeadCell({
  align,
  children,
}: Readonly<{ align?: "right"; children: React.ReactNode }>) {
  return (
    <TableHead
      className={`text-xs font-normal whitespace-nowrap text-(--subtle) ${
        align === "right" ? "text-right" : ""
      }`}
    >
      {children}
    </TableHead>
  );
}

function SummaryCell({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="flex items-center gap-2 p-3 outline-1 outline-border">{children}</div>;
}

function AccountTableRow({
  account,
  selected,
  onToggle,
}: Readonly<{ account: AccountRow; selected: boolean; onToggle: () => void }>) {
  return (
    <TableRow
      data-state={selected ? "selected" : undefined}
      className="transition-colors duration-150 ease-(--ease-out-strong) hover:bg-card/60 data-[state=selected]:bg-card"
    >
      <TableCell>
        <span className="flex items-center gap-3">
          <Checkbox
            checked={selected}
            onCheckedChange={onToggle}
            aria-label={`Select ${account.name}`}
          />
          <Link
            href={`/console/accounts/${account.id}`}
            className="font-medium underline-offset-2 hover:underline"
          >
            {account.name}
          </Link>
        </span>
      </TableCell>
      <TableCell>
        <span className="flex items-center gap-1">
          {account.sector && <TagPill tone={tagToneFor(account.sector)}>{account.sector}</TagPill>}
          {account.unit && <TagPill>{account.unit}</TagPill>}
          {!account.sector && !account.unit && <Empty>None</Empty>}
        </span>
      </TableCell>
      <Count value={account.contacts} />
      <TableCell>
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden
            className={`size-1.5 rounded-full ${
              account.decisionMaker ? "bg-(--status)" : "bg-(--track)"
            }`}
          />
          {account.decisionMaker ? "Named" : <Empty>None</Empty>}
        </span>
      </TableCell>
      <Count value={account.openLeads} />
      <Count value={account.openPursuits} />
      <TableCell className="text-right tabular-nums">
        {account.weighted > 0 ? (
          <span className="inline-flex items-center gap-1">
            <span className="text-muted-foreground">UGX</span>
            {formatAmount(account.weighted)}
          </span>
        ) : (
          <Empty>0</Empty>
        )}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        <WinProbability account={account} />
      </TableCell>
      <TableCell className="tabular-nums">
        {account.lastMovement ? (
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-3.5 shrink-0 text-(--icon)" aria-hidden />
            {account.lastMovement}
          </span>
        ) : (
          <Empty>No movement</Empty>
        )}
      </TableCell>
      <TableCell className="tabular-nums text-(--c-muted)">{account.createdAt}</TableCell>
      <TableCell>
        <Link
          href={`/console/accounts/${account.id}`}
          aria-label={`Open ${account.name} details`}
          className="inline-flex size-6 items-center justify-center rounded-full transition-colors duration-150 hover:bg-foreground/6"
        >
          <Ellipsis className="size-3" aria-hidden />
        </Link>
      </TableCell>
    </TableRow>
  );
}

const METER_SEGMENTS = 18;

function WinProbability({ account }: Readonly<{ account: AccountRow }>) {
  if (account.openValue <= 0) return <Empty>No open value</Empty>;
  const value = Math.min(100, Math.max(0, Math.round((account.weighted / account.openValue) * 100)));
  const filled = Math.round((value / 100) * METER_SEGMENTS);

  return (
    <span className="inline-flex items-center gap-2">
      <span
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        aria-label={`Win probability ${value} percent`}
        className="flex h-3.5 w-[74px] items-center gap-[2px] overflow-hidden rounded-[2px] bg-foreground/8 px-[2px]"
      >
        {Array.from({ length: METER_SEGMENTS }, (_, index) => (
          <span
            key={index}
            className={`h-2.5 min-w-px flex-1 rounded-[1px] ${segmentClass(index, filled)}`}
          />
        ))}
      </span>
      <span className="w-[4ch] text-right">{value}%</span>
    </span>
  );
}

function segmentClass(index: number, filled: number): string {
  if (index >= filled) return "bg-(--track)";
  if (index < METER_SEGMENTS * 0.25) return "bg-(--danger)";
  if (index < METER_SEGMENTS * 0.55) return "bg-(--warning)";
  return "bg-(--success)";
}

function Count({ value }: Readonly<{ value: number }>) {
  return (
    <TableCell className="text-right tabular-nums">
      {value > 0 ? value : <Empty>0</Empty>}
    </TableCell>
  );
}

function Empty({ children }: Readonly<{ children: React.ReactNode }>) {
  return <span className="text-(--c-muted)">{children}</span>;
}
