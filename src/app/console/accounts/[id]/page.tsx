import { CalendarDays, Mail, Phone, Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { FormSheet } from "@/components/console/FormSheet";
import { CheckboxField, FormSection, TextField } from "@/components/console/fields";
import { PanelSection, StatTile } from "@/components/console/panel";
import { EmptyState, pillClass, TagPill, tagToneFor, type TagTone } from "@/components/console/ui";
import { ProbabilityMeter, TrendBars } from "@/components/console/viz";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { winProbability } from "@/lib/account-table";
import {
  accountEngagement,
  accountLeads,
  accountPanelStats,
  accountPursuits,
  accountTimeline,
  getAccount,
  type AccountPursuit,
} from "@/lib/accounts";
import { db } from "@/lib/db";
import { formatAmount, formatShortDate } from "@/lib/format";

import { submitContact } from "../actions";
import { EditAccountSheet } from "./EditAccountSheet";

export default async function AccountPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const account = await getAccount(id);
  if (!account) notFound();

  const [stats, pursuits, leads, timeline, engagement, units, sectors] = await Promise.all([
    accountPanelStats(id),
    accountPursuits(id),
    accountLeads(id),
    accountTimeline(id),
    accountEngagement(id),
    db().unit.findMany({ where: { active: true }, orderBy: { code: "asc" } }),
    db().sector.findMany({ where: { active: true }, orderBy: { code: "asc" } }),
  ]);
  const probability = winProbability(stats.weighted, stats.openValue);
  const movements = stats.trend.reduce((sum, value) => sum + value, 0);

  return (
    <div className="grid w-full content-start gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl leading-none font-semibold tracking-[-0.01em]">
              {account.name}
            </h1>
            {account.sector && (
              <TagPill tone={tagToneFor(account.sector.code)}>{account.sector.code}</TagPill>
            )}
            {account.unit && <TagPill>{account.unit.code}</TagPill>}
          </div>
          <p className="text-xs text-muted-foreground">
            Added {formatShortDate(account.created_at.toISOString().slice(0, 10))} ·{" "}
            {account.country}
          </p>
        </div>
        <EditAccountSheet
          account={{
            id: account.id.toString(),
            name: account.name,
            unitId: account.unit_id?.toString(),
            sectorId: account.sector_id?.toString(),
          }}
          units={units.map((u) => ({ value: u.id.toString(), label: u.name }))}
          sectors={sectors.map((s) => ({ value: s.id.toString(), label: s.code }))}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
        <StatTile label="Weighted UGX" value={formatAmount(stats.weighted)} />
        <StatTile label="Open value UGX" value={formatAmount(stats.openValue)} />
        <StatTile label="Win probability">
          {probability === null ? (
            <span className="text-sm text-(--c-muted)">No open value</span>
          ) : (
            <span className="flex items-center gap-2">
              <ProbabilityMeter value={probability} />
              <span className="text-sm leading-none font-medium tabular-nums">
                {probability}%
              </span>
            </span>
          )}
        </StatTile>
        <StatTile label="Open pursuits" value={String(stats.openPursuits)} />
        <StatTile label="Open leads" value={String(stats.openLeads)} />
        <StatTile label="Movement, 14 weeks">
          <span className="flex items-center gap-2">
            <span className="text-sm leading-none font-medium tabular-nums">{movements}</span>
            <TrendBars trend={stats.trend} />
          </span>
        </StatTile>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid min-w-0 content-start gap-6">
          <PanelSection title={`Pursuits (${pursuits.length})`}>
            {pursuits.length === 0 ? (
              <EmptyState>No opportunities on this account yet.</EmptyState>
            ) : (
              <PursuitsTable pursuits={pursuits} />
            )}
          </PanelSection>

          <PanelSection title={`Open leads (${leads.length})`}>
            {leads.length === 0 ? (
              <EmptyState>No open leads matched to this account.</EmptyState>
            ) : (
              <ul className="grid gap-1">
                {leads.map((lead) => (
                  <li key={lead.id}>
                    <Link
                      href={`/console/leads/${lead.id}`}
                      className="-mx-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg px-2 py-1.5 transition-colors duration-150 ease-(--ease-out-strong) hover:bg-card/60"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-sm font-medium">{lead.name}</span>
                        <TagPill tone={leadTone(lead.status)}>{lead.status}</TagPill>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {lead.owner} · {formatShortDate(lead.createdAt)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </PanelSection>
        </div>

        <div className="grid min-w-0 content-start gap-6">
          <PanelSection title="Engagement, 30 days">
            <div className="grid grid-cols-2 gap-2">
              <StatTile label="Total touches" value={String(engagement.total)} />
              <StatTile label="Meetings" value={String(engagement.meetings)} />
              <StatTile label="Calls" value={String(engagement.calls)} />
              <StatTile label="Submissions" value={String(engagement.submissions)} />
            </div>
            {engagement.total === 0 && (
              <p className="text-xs text-muted-foreground">
                No activities recorded yet. Counts fill in as activities are captured.
              </p>
            )}
          </PanelSection>

          <PanelSection
            title={`Contacts (${account.contact.length})`}
            action={
              <AddContactSheet accountId={account.id.toString()} accountName={account.name} />
            }
          >
            {account.contact.length === 0 ? (
              <p className="text-sm text-(--c-muted)">
                No contacts yet. A lead cannot be qualified without one.
              </p>
            ) : (
              <ul className="grid gap-2">
                {account.contact.map((contact) => (
                  <li
                    key={contact.id.toString()}
                    className="grid gap-1 rounded-lg border border-border p-3"
                  >
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{contact.full_name}</span>
                      {contact.is_decision_maker && <TagPill>Decision maker</TagPill>}
                    </span>
                    {contact.role_title && (
                      <span className="text-xs text-muted-foreground">{contact.role_title}</span>
                    )}
                    {(contact.email || contact.phone) && (
                      <span className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-(--c-muted)">
                        {contact.email && (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="size-3" aria-hidden />
                            {contact.email}
                          </span>
                        )}
                        {contact.phone && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="size-3" aria-hidden />
                            {contact.phone}
                          </span>
                        )}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </PanelSection>

          <PanelSection title="Activity">
            {timeline.length === 0 ? (
              <p className="text-sm text-(--c-muted)">No stage movements yet.</p>
            ) : (
              <ul className="grid gap-2">
                {timeline.map((movement) => (
                  <li key={movement.id} className="grid gap-1 text-sm leading-snug">
                    <span>
                      <span className="font-medium">{movement.actor}</span> moved{" "}
                      <span className="font-medium">{movement.opportunity}</span> to{" "}
                      {movement.stage}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <CalendarDays className="size-3" aria-hidden />
                      {formatShortDate(movement.changedAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </PanelSection>
        </div>
      </div>
    </div>
  );
}

function PursuitsTable({ pursuits }: Readonly<{ pursuits: ReadonlyArray<AccountPursuit> }>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table className="text-sm leading-none [&_td]:h-[42px] [&_td]:px-3 [&_td]:py-0 [&_th]:h-[38px] [&_th]:px-3">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <Head>Pursuit</Head>
            <Head>Stage</Head>
            <Head>Owner</Head>
            <Head align="right">Expected (UGX)</Head>
            <Head align="right">Weighted (UGX)</Head>
            <Head align="right">Probability</Head>
            <Head>Last movement</Head>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pursuits.map((pursuit) => (
            <PursuitRow key={pursuit.id} pursuit={pursuit} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function PursuitRow({ pursuit }: Readonly<{ pursuit: AccountPursuit }>) {
  const probability =
    pursuit.expected > 0
      ? winProbability(pursuit.weighted, pursuit.expected)
      : Math.round(pursuit.probability);

  return (
    <TableRow className="transition-colors duration-150 ease-(--ease-out-strong) hover:bg-card/60">
      <TableCell>
        <Link
          href={`/console/opportunities/${pursuit.id}`}
          className="font-medium underline-offset-2 hover:underline"
        >
          {pursuit.name}
        </Link>
      </TableCell>
      <TableCell>
        <span className="flex items-center gap-1">
          <TagPill tone={tagToneFor(pursuit.stageCode)}>{pursuit.stage}</TagPill>
          {pursuit.outcome !== "open" && (
            <TagPill tone={outcomeTone(pursuit.outcome)}>{pursuit.outcome}</TagPill>
          )}
        </span>
      </TableCell>
      <TableCell>{pursuit.owner}</TableCell>
      <TableCell className="text-right tabular-nums">
        {pursuit.expected > 0 ? formatAmount(pursuit.expected) : <Muted>0</Muted>}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {pursuit.weighted > 0 ? formatAmount(pursuit.weighted) : <Muted>0</Muted>}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {probability === null ? (
          <Muted>n/a</Muted>
        ) : (
          <span className="inline-flex items-center gap-2">
            <ProbabilityMeter value={probability} />
            <span className="w-[4ch] text-right">{probability}%</span>
          </span>
        )}
      </TableCell>
      <TableCell className="tabular-nums">
        {pursuit.lastMovement ? (
          formatShortDate(pursuit.lastMovement)
        ) : (
          <Muted>No movement</Muted>
        )}
      </TableCell>
    </TableRow>
  );
}

function AddContactSheet({
  accountId,
  accountName,
}: Readonly<{ accountId: string; accountName: string }>) {
  return (
    <FormSheet
      trigger={
        <Button size="sm" variant="secondary" className={pillClass}>
          <Plus className="size-3" aria-hidden />
          Add contact
        </Button>
      }
      title="Add a contact"
      description={`A new contact on ${accountName}.`}
      action={submitContact}
      submitLabel="Add contact"
    >
      <input type="hidden" name="accountId" value={accountId} />
      <FormSection title="Contact">
        <TextField label="Full name" name="fullName" required />
        <TextField label="Role" name="roleTitle" />
      </FormSection>
      <FormSection title="Reach">
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Email" name="email" type="email" />
          <TextField label="Phone" name="phone" />
        </div>
        <CheckboxField label="Decision maker" name="isDecisionMaker" />
      </FormSection>
    </FormSheet>
  );
}

const HEAD_ALIGN = { right: "text-right" } as const;

function Head({
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

function Muted({ children }: Readonly<{ children: React.ReactNode }>) {
  return <span className="text-(--c-muted)">{children}</span>;
}

function leadTone(status: string): TagTone {
  switch (status) {
    case "new":
      return "blue";
    case "contacted":
      return "teal";
    case "qualifying":
      return "amber";
    case "qualified":
      return "green";
    default:
      return "neutral";
  }
}

function outcomeTone(outcome: string): TagTone {
  switch (outcome) {
    case "won":
      return "green";
    case "lost":
      return "red";
    case "on_hold":
      return "amber";
    default:
      return "neutral";
  }
}
