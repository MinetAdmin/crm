"use client";

import * as React from "react";

import { CalendarDays, Ellipsis } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { UserSheet } from "@/components/console/ProfileSheet";
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
import { winProbability, type AccountRow, type AccountSummary } from "@/lib/account-table";
import { formatAmount, formatShortDate } from "@/lib/format";

import { ProbabilityMeter, TrendBars } from "@/components/console/viz";

export function AccountsTable({
  accounts,
  summary,
}: Readonly<{ accounts: ReadonlyArray<AccountRow>; summary: AccountSummary }>) {
  const [selected, setSelected] = React.useState<ReadonlySet<string>>(new Set());
  const [owner, setOwner] = React.useState<{ id: string; name: string } | null>(null);
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
                    aria-label="Select all accounts"
                  />
                  Account
                </span>
              </HeadCell>
              <HeadCell>Sector &amp; Unit</HeadCell>
              <HeadCell>Account owner</HeadCell>
              <HeadCell align="right">Contacts</HeadCell>
              <HeadCell align="right">Open leads</HeadCell>
              <HeadCell align="right">Open pursuits</HeadCell>
              <HeadCell align="right">Weighted (UGX)</HeadCell>
              <HeadCell align="right">Win probability</HeadCell>
              <HeadCell align="center">Trend</HeadCell>
              <HeadCell>Last movement</HeadCell>
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
                onOwnerClick={setOwner}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid shrink-0 grid-cols-2 gap-px border-b border-border bg-background p-px text-xs sm:grid-cols-4">
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

      <UserSheet owner={owner} onClose={() => setOwner(null)} />
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

function AccountTableRow({
  account,
  selected,
  onToggle,
  onOwnerClick,
}: Readonly<{
  account: AccountRow;
  selected: boolean;
  onToggle: () => void;
  onOwnerClick: (owner: { id: string; name: string }) => void;
}>) {
  const router = useRouter();
  const owner = account.owner;
  const openAccount = (event: React.MouseEvent<HTMLTableRowElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("a,button,input,label,[role=checkbox]")) return;
    router.push(`/console/accounts/${account.id}`);
  };

  return (
    <TableRow
      data-state={selected ? "selected" : undefined}
      onClick={openAccount}
      className="cursor-pointer transition-colors duration-150 ease-(--ease-out-strong) hover:bg-card/60 data-[state=selected]:bg-card"
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
      <TableCell>
        {owner ? (
          <button
            type="button"
            onClick={() => onOwnerClick(owner)}
            aria-label={`Open profile for ${owner.name}`}
            className="-mx-1.5 inline-flex cursor-pointer items-center gap-1.5 rounded-full px-1.5 py-1 transition-colors duration-150 ease-(--ease-out-strong) hover:bg-foreground/6"
          >
            <span
              aria-hidden
              className="grid size-5 shrink-0 place-items-center rounded-full bg-muted text-[9px] font-medium text-(--chip) outline-1 -outline-offset-1 outline-white/10"
            >
              {initialsOf(owner.name)}
            </span>
            {owner.name}
          </button>
        ) : (
          <Empty>None</Empty>
        )}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        <span
          className="inline-flex items-center gap-1.5"
          title={account.decisionMaker ? "Decision maker named" : "No decision maker"}
        >
          <span
            aria-hidden
            className={`size-1.5 rounded-full ${
              account.decisionMaker ? "bg-(--status)" : "bg-(--track)"
            }`}
          />
          {account.contacts > 0 ? account.contacts : <Empty>0</Empty>}
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
      <TableCell className="text-center">
        <TrendBars trend={account.trend} />
      </TableCell>
      <TableCell className="tabular-nums">
        {account.lastMovement ? (
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-3.5 shrink-0 text-(--icon)" aria-hidden />
            {formatShortDate(account.lastMovement)}
          </span>
        ) : (
          <Empty>No movement</Empty>
        )}
      </TableCell>
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

function WinProbability({ account }: Readonly<{ account: AccountRow }>) {
  const value = winProbability(account.weighted, account.openValue);
  if (value === null) return <Empty>No open value</Empty>;

  return (
    <span className="inline-flex items-center gap-2">
      <ProbabilityMeter value={value} />
      <span className="w-[4ch] text-right">{value}%</span>
    </span>
  );
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

function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/);
  const first = words[0]?.[0] ?? "";
  const second = words.length > 1 ? (words[1][0] ?? "") : "";
  return (first + second).toUpperCase();
}
