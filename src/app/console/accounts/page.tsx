import {
  ArrowDown,
  ArrowUp,
  Banknote,
  Building2,
  CalendarDays,
  Clock,
  Layers,
  Sprout,
  Tag,
  TrendingUp,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { SelectField } from "@/components/console/fields";
import { EmptyState } from "@/components/console/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  defaultDir,
  parseSort,
  sortAccounts,
  summarizeAccounts,
  type AccountRow,
  type SortDir,
  type SortKey,
} from "@/lib/account-table";
import { ACCOUNT_LIST_CAP, listAccounts } from "@/lib/accounts";
import { db } from "@/lib/db";
import { formatAmount } from "@/lib/format";
import { NewAccountSheet } from "./NewAccountSheet";

type Search = { q?: string; unit?: string; sector?: string; sort?: string; dir?: string };

export default async function AccountsPage({
  searchParams,
}: Readonly<{ searchParams: Promise<Search> }>) {
  const { q, unit, sector, sort, dir } = await searchParams;
  const { key, dir: direction } = parseSort(sort, dir);

  const [rows, units, sectors] = await Promise.all([
    listAccounts({ search: q, unitId: unit, sectorId: sector }),
    db().unit.findMany({ where: { active: true }, orderBy: { code: "asc" } }),
    db().sector.findMany({ where: { active: true }, orderBy: { code: "asc" } }),
  ]);
  const accounts = sortAccounts(rows, key, direction);
  const summary = summarizeAccounts(accounts);
  const filters = { q, unit, sector };
  const filtered = Boolean(q || unit || sector);

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-2">
        <form className="flex min-w-0 flex-1 flex-wrap items-center gap-2" role="search">
          <Input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search accounts"
            aria-label="Search accounts by name"
            className="w-56"
          />
          <div className="w-36">
            <SelectField
              label="Unit"
              labelHidden
              name="unit"
              defaultValue={unit}
              emptyLabel="All units"
              options={units.map((u) => ({ value: u.id.toString(), label: u.code }))}
            />
          </div>
          <div className="w-36">
            <SelectField
              label="Sector"
              labelHidden
              name="sector"
              defaultValue={sector}
              emptyLabel="All sectors"
              options={sectors.map((s) => ({ value: s.id.toString(), label: s.code }))}
            />
          </div>
          {sort && <input type="hidden" name="sort" value={sort} />}
          {dir && <input type="hidden" name="dir" value={dir} />}
          <Button type="submit" variant="outline" size="sm">
            Apply
          </Button>
          {filtered && (
            <Button asChild variant="ghost" size="sm">
              <Link href="/console/accounts">Clear</Link>
            </Button>
          )}
        </form>
        <span className="text-sm tabular-nums text-(--c-muted)">
          {summary.accounts} {summary.accounts === 1 ? "account" : "accounts"}
        </span>
        <NewAccountSheet
          units={units.map((u) => ({ value: u.id.toString(), label: u.name }))}
          sectors={sectors.map((s) => ({ value: s.id.toString(), label: s.code }))}
        />
      </div>

      {accounts.length === 0 ? (
        <div className="mt-4">
          <EmptyState>
            {filtered
              ? "No account matches these filters."
              : "No accounts yet. The first one starts here."}
          </EmptyState>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-md border border-(--c-line) bg-(--c-surface)">
          <Table className="[&_td]:border-l [&_td]:border-(--c-line-soft) [&_td:first-child]:border-l-0 [&_th]:border-l [&_th]:border-(--c-line-soft) [&_th:first-child]:border-l-0">
            <TableHeader>
              <TableRow>
                <SortHead label="Account" icon={Building2} k="name" activeKey={key} dir={direction} filters={filters} />
                <SortHead label="Unit" icon={Layers} k="unit" activeKey={key} dir={direction} filters={filters} />
                <SortHead label="Sector" icon={Tag} k="sector" activeKey={key} dir={direction} filters={filters} />
                <SortHead label="Contacts" icon={Users} k="contacts" activeKey={key} dir={direction} filters={filters} align="right" />
                <TableHead>
                  <span className="inline-flex items-center gap-1.5">
                    <UserCheck className="size-3.5" aria-hidden />
                    Decision maker
                  </span>
                </TableHead>
                <SortHead label="Open leads" icon={Sprout} k="leads" activeKey={key} dir={direction} filters={filters} align="right" />
                <SortHead label="Open pursuits" icon={TrendingUp} k="pursuits" activeKey={key} dir={direction} filters={filters} align="right" />
                <SortHead label="Weighted (UGX)" icon={Banknote} k="weighted" activeKey={key} dir={direction} filters={filters} align="right" />
                <SortHead label="Last movement" icon={Clock} k="movement" activeKey={key} dir={direction} filters={filters} />
                <SortHead label="Created" icon={CalendarDays} k="created" activeKey={key} dir={direction} filters={filters} />
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <AccountTableRow key={account.id} account={account} />
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="text-[13px] text-(--c-muted)">
                <TableCell className="tabular-nums">{summary.accounts} count</TableCell>
                <TableCell />
                <TableCell />
                <TableCell className="text-right tabular-nums">{summary.contacts}</TableCell>
                <TableCell />
                <TableCell className="text-right tabular-nums">{summary.openLeads}</TableCell>
                <TableCell className="text-right tabular-nums">{summary.openPursuits}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatAmount(summary.weighted)}
                </TableCell>
                <TableCell />
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}

      {rows.length === ACCOUNT_LIST_CAP && (
        <p className="mt-2 text-[13px] text-(--c-muted)">
          Showing the first {ACCOUNT_LIST_CAP} accounts. Narrow with search or filters to see the
          rest.
        </p>
      )}
    </div>
  );
}

function SortHead({
  label,
  icon: Icon,
  k,
  activeKey,
  dir,
  filters,
  align,
}: Readonly<{
  label: string;
  icon: LucideIcon;
  k: SortKey;
  activeKey: SortKey;
  dir: SortDir;
  filters: Readonly<{ q?: string; unit?: string; sector?: string }>;
  align?: "right";
}>) {
  const active = activeKey === k;
  const next: SortDir = active ? (dir === "asc" ? "desc" : "asc") : defaultDir(k);
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.unit) params.set("unit", filters.unit);
  if (filters.sector) params.set("sector", filters.sector);
  params.set("sort", k);
  params.set("dir", next);

  const Arrow = dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <TableHead className={align === "right" ? "text-right" : undefined}>
      <Link
        href={`/console/accounts?${params}`}
        aria-label={`Sort by ${label.toLowerCase()}`}
        className={`inline-flex items-center gap-1.5 hover:text-foreground ${
          active ? "text-foreground" : ""
        }`}
      >
        <Icon className="size-3.5" aria-hidden />
        {label}
        {active && <Arrow className="size-2.5" aria-hidden />}
      </Link>
    </TableHead>
  );
}

function AccountTableRow({ account }: Readonly<{ account: AccountRow }>) {
  return (
    <TableRow>
      <TableCell>
        <Link
          href={`/console/accounts/${account.id}`}
          className="flex items-center gap-2.5 font-medium underline-offset-2 hover:underline"
        >
          <span
            aria-hidden
            className="grid size-6 shrink-0 place-items-center rounded-md border border-(--c-line) bg-(--c-wash) text-[11px] font-medium"
          >
            {initialsOf(account.name)}
          </span>
          {account.name}
        </Link>
      </TableCell>
      <TableCell className="text-(--c-muted)">{account.unit ?? <Empty>No unit</Empty>}</TableCell>
      <TableCell>
        {account.sector ? (
          <Badge variant="outline">{account.sector}</Badge>
        ) : (
          <Empty>No sector</Empty>
        )}
      </TableCell>
      <Count value={account.contacts} />
      <TableCell>
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden
            className={`size-1.5 rounded-full ${
              account.decisionMaker ? "bg-(--c-good)" : "bg-(--c-line)"
            }`}
          />
          {account.decisionMaker ? "Named" : <Empty>None</Empty>}
        </span>
      </TableCell>
      <Count value={account.openLeads} />
      <Count value={account.openPursuits} />
      <TableCell className="text-right tabular-nums">
        {account.weighted > 0 ? formatAmount(account.weighted) : <Empty>0</Empty>}
      </TableCell>
      <TableCell className="tabular-nums">
        {account.lastMovement ?? <Empty>No movement</Empty>}
      </TableCell>
      <TableCell className="tabular-nums text-(--c-muted)">{account.createdAt}</TableCell>
    </TableRow>
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
