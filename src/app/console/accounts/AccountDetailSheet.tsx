"use client";

import { Mail, Phone } from "lucide-react";
import { useRouter } from "next/navigation";

import { pillClass, pillPrimaryClass, TagPill, tagToneFor } from "@/components/console/ui";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { winProbability } from "@/lib/account-table";
import type { AccountPanelStats } from "@/lib/accounts";
import { formatAmount, formatShortDate } from "@/lib/format";

import { ProbabilityMeter, TrendBars } from "./viz";

export type AccountPanel = {
  id: string;
  name: string;
  unit: string | null;
  sector: string | null;
  country: string;
  createdAt: string;
  contacts: ReadonlyArray<{
    id: string;
    name: string;
    role: string | null;
    email: string | null;
    phone: string | null;
    decisionMaker: boolean;
  }>;
};

export function AccountDetailSheet({
  account,
  stats,
}: Readonly<{ account: AccountPanel; stats: AccountPanelStats }>) {
  const router = useRouter();
  const probability = winProbability(stats.weighted, stats.openValue);
  const decisionMaker = account.contacts.find((contact) => contact.decisionMaker);

  return (
    <Sheet open onOpenChange={(open) => !open && router.back()}>
      <SheetContent className="w-full gap-0 data-[side=right]:sm:max-w-md">
        <SheetHeader className="gap-1 border-b border-border pr-12">
          <SheetTitle className="text-[16px] leading-none font-medium">
            Account detail
          </SheetTitle>
          <SheetDescription className="text-xs">
            Added {formatShortDate(account.createdAt)} · {account.country}
          </SheetDescription>
        </SheetHeader>

        <div className="grid flex-1 content-start gap-4 overflow-y-auto p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[16px] leading-none font-medium">{account.name}</span>
            <span className="flex items-center gap-1">
              {account.sector && (
                <TagPill tone={tagToneFor(account.sector)}>{account.sector}</TagPill>
              )}
              {account.unit && <TagPill>{account.unit}</TagPill>}
            </span>
          </div>

          <PanelSection title="Account summary">
            {decisionMaker ? (
              <ContactLine contact={decisionMaker} />
            ) : (
              <p className="text-sm text-(--c-muted)">
                No decision maker named yet. A lead cannot be qualified without one.
              </p>
            )}
          </PanelSection>

          <PanelSection title="Pipeline health">
            {probability === null ? (
              <p className="text-sm text-(--c-muted)">No open pipeline value.</p>
            ) : (
              <>
                <p className="text-2xl leading-none font-medium tabular-nums">{probability}%</p>
                <p className="text-xs text-muted-foreground">
                  Win probability across open pursuits
                </p>
                <ProbabilityMeter value={probability} segments={36} className="w-full" />
              </>
            )}
            <div className="mt-1 grid grid-cols-2 gap-2">
              <StatTile label="Weighted UGX" value={formatAmount(stats.weighted)} />
              <StatTile label="Open value UGX" value={formatAmount(stats.openValue)} />
              <StatTile label="Open pursuits" value={String(stats.openPursuits)} />
              <StatTile label="Open leads" value={String(stats.openLeads)} />
            </div>
          </PanelSection>

          <PanelSection title="Movement trend">
            <span className="flex items-baseline gap-2">
              <span className="text-2xl leading-none font-medium tabular-nums">
                {stats.trend.reduce((sum, value) => sum + value, 0)}
              </span>
              <TrendBars trend={stats.trend} />
            </span>
            <p className="text-xs text-muted-foreground">
              Stage movements in the last 14 weeks
              {stats.lastMovement && `, latest ${formatShortDate(stats.lastMovement)}`}
            </p>
          </PanelSection>

          <PanelSection title={`Contacts (${account.contacts.length})`}>
            {account.contacts.length === 0 ? (
              <p className="text-sm text-(--c-muted)">No contacts yet.</p>
            ) : (
              <ul className="grid gap-2">
                {account.contacts.map((contact) => (
                  <li key={contact.id}>
                    <ContactLine contact={contact} />
                  </li>
                ))}
              </ul>
            )}
          </PanelSection>
        </div>

        <SheetFooter className="flex-row items-center justify-end gap-2 border-t border-border">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className={pillClass}
            onClick={() => router.back()}
          >
            Close
          </Button>
          <Button asChild size="sm" className={pillPrimaryClass}>
            <a href={`/console/accounts/${account.id}`}>Open full record</a>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function PanelSection({
  title,
  children,
}: Readonly<{ title: string; children: React.ReactNode }>) {
  return (
    <section className="grid content-start gap-2 border-t border-border pt-4">
      <h3 className="text-[11px] font-medium tracking-[0.08em] text-(--subtle) uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}

function StatTile({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="grid gap-1.5 rounded-lg border border-border p-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm leading-none font-medium tabular-nums">{value}</span>
    </div>
  );
}

function ContactLine({
  contact,
}: Readonly<{
  contact: AccountPanel["contacts"][number];
}>) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      <span className="font-medium">{contact.name}</span>
      {contact.decisionMaker && <TagPill>Decision maker</TagPill>}
      {contact.role && <span className="text-(--c-muted)">{contact.role}</span>}
      {contact.email && (
        <span className="inline-flex items-center gap-1 text-(--c-muted)">
          <Mail className="size-3" aria-hidden />
          {contact.email}
        </span>
      )}
      {contact.phone && (
        <span className="inline-flex items-center gap-1 text-(--c-muted)">
          <Phone className="size-3" aria-hidden />
          {contact.phone}
        </span>
      )}
    </div>
  );
}
