"use client";

import * as React from "react";

import { Mail, Phone } from "lucide-react";

import { getAccountPanel, type AccountPanel } from "@/app/console/actions";
import { pillClass, pillPrimaryClass, TagPill, tagToneFor } from "@/components/console/ui";
import { PanelSection, StatTile } from "@/components/console/panel";
import { ProbabilityMeter, TrendBars } from "@/components/console/viz";
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
import type { AccountPanelStats } from "@/lib/accounts";
import { formatAmount, formatShortDate } from "@/lib/format";

type Target = { id: string; name: string };
type Loaded = {
  id: string;
  account: AccountPanel | null;
  stats: AccountPanelStats | null;
};

export function AccountDetailSheet({
  target,
  onClose,
}: Readonly<{ target: Target | null; onClose: () => void }>) {
  const [loaded, setLoaded] = React.useState<Loaded | null>(null);

  React.useEffect(() => {
    if (!target || loaded?.id === target.id) return;
    let stale = false;
    getAccountPanel(target.id)
      .then((result) => {
        if (stale) return;
        setLoaded({
          id: target.id,
          account: result?.account ?? null,
          stats: result?.stats ?? null,
        });
      })
      .catch(() => {
        if (!stale) setLoaded({ id: target.id, account: null, stats: null });
      });
    return () => {
      stale = true;
    };
  }, [target, loaded]);

  if (!target) return null;
  const account = loaded?.id === target.id ? loaded.account : null;
  const stats = loaded?.id === target.id ? loaded.stats : null;
  const pending = loaded?.id !== target.id;

  return (
    <Sheet open onOpenChange={(next) => !next && onClose()}>
      <SheetContent className="w-full gap-0 data-[side=right]:sm:max-w-md">
        <SheetHeader className="gap-1 border-b border-border pr-12">
          <SheetTitle className="text-[16px] leading-none font-medium">
            Account detail
          </SheetTitle>
          <SheetDescription className="text-xs">
            {account
              ? `Added ${formatShortDate(account.createdAt)} · ${account.country}`
              : "Summary of the account and its pipeline."}
          </SheetDescription>
        </SheetHeader>

        <div className="grid flex-1 content-start gap-4 overflow-y-auto p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[16px] leading-none font-medium">{target.name}</span>
            {account && (
              <span className="flex items-center gap-1">
                {account.sector && (
                  <TagPill tone={tagToneFor(account.sector)}>{account.sector}</TagPill>
                )}
                {account.unit && <TagPill>{account.unit}</TagPill>}
              </span>
            )}
          </div>

          {pending && <PanelSkeleton />}
          {!pending && (!account || !stats) && (
            <p className="text-sm text-(--c-muted)">Could not load this account.</p>
          )}
          {account && stats && <PanelContent account={account} stats={stats} />}
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
            <a href={`/console/accounts/${target.id}`}>Open full record</a>
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
  account,
  stats,
}: Readonly<{ account: AccountPanel; stats: AccountPanelStats }>) {
  const probability = winProbability(stats.weighted, stats.openValue);
  const decisionMaker = account.contacts.find((contact) => contact.decisionMaker);

  return (
    <>
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
    </>
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
