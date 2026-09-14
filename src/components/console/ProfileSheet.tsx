"use client";

import * as React from "react";

import { LogOut, Mail } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";

import { getProfilePanel, type ProfilePanel } from "@/app/console/actions";
import { pillClass, pillPrimaryClass } from "@/components/console/ui";
import { ProbabilityMeter } from "@/components/console/viz";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { formatAmount } from "@/lib/format";

type ConsoleUser = { name: string; email: string; role: string };

export function ProfileSheet({
  user,
  signOutAction,
}: Readonly<{ user: ConsoleUser; signOutAction: () => Promise<void> }>) {
  const [open, setOpen] = React.useState(false);
  const [panel, setPanel] = React.useState<ProfilePanel | "error" | null>(null);
  const initials = initialsOf(user.name);

  React.useEffect(() => {
    if (!open || panel !== null) return;
    getProfilePanel()
      .then(setPanel)
      .catch(() => setPanel("error"));
  }, [open, panel]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label={`Open profile for ${user.name}`}
          className="inline-flex h-[30px] shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-secondary py-[5px] pr-[9px] pl-[5px] text-xs text-secondary-foreground shadow-(--pill-shadow) transition-[background-color,color,box-shadow,scale] duration-150 ease-(--ease-out-strong) outline-none select-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/60 active:scale-[0.96] data-[state=open]:bg-muted"
        >
          <Avatar className="size-5">
            <AvatarFallback className="text-[9px]">{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden max-w-32 truncate sm:inline">{user.name}</span>
        </button>
      </SheetTrigger>
      <SheetContent className="w-full gap-0 data-[side=right]:sm:max-w-md">
        <SheetHeader className="gap-1 border-b border-border pr-12">
          <SheetTitle className="text-[16px] leading-none font-medium">My profile</SheetTitle>
          <SheetDescription className="sr-only">
            Your contact details, pipeline summary, and preferences.
          </SheetDescription>
        </SheetHeader>

        <div className="grid flex-1 content-start gap-4 overflow-y-auto p-4">
          <div className="flex items-center gap-3">
            <Avatar className="size-12">
              <AvatarFallback className="text-sm">{initials}</AvatarFallback>
            </Avatar>
            <span className="grid min-w-0 gap-1">
              <span className="truncate text-[16px] leading-none font-medium">{user.name}</span>
              <span className="truncate text-xs text-muted-foreground capitalize">
                {user.role.replaceAll("_", " ")}
              </span>
            </span>
          </div>

          <PanelSection title="Contact">
            <span className="inline-flex items-center gap-1.5 text-sm text-(--c-muted)">
              <Mail className="size-3.5" aria-hidden />
              {user.email}
            </span>
          </PanelSection>

          <PanelSection title="Pipeline">
            <PipelineTiles panel={panel} />
          </PanelSection>

          <PanelSection title="Top accounts">
            <TopAccounts panel={panel} onNavigate={() => setOpen(false)} />
          </PanelSection>

          <PanelSection title="Theme">
            <ThemeSwitch />
          </PanelSection>
        </div>

        <SheetFooter className="flex-row items-center border-t border-border">
          <form action={signOutAction}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="rounded-full text-(--subtle) hover:text-foreground"
            >
              <LogOut className="size-3.5" aria-hidden />
              Sign out
            </Button>
          </form>
          <div className="ml-auto flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className={pillClass}
              onClick={() => setOpen(false)}
            >
              Close
            </Button>
            <Button asChild size="sm" className={pillPrimaryClass}>
              <Link href="/console/accounts" onClick={() => setOpen(false)}>
                Show all accounts
              </Link>
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function PipelineTiles({ panel }: Readonly<{ panel: ProfilePanel | "error" | null }>) {
  if (panel === "error") {
    return <p className="text-sm text-(--c-muted)">Could not load pipeline figures.</p>;
  }
  if (panel === null) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-[62px] rounded-lg" />
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-2">
      <StatTile label="Accounts" value={String(panel.accounts)} />
      <StatTile label="Open pursuits" value={String(panel.openPursuits)} />
      <StatTile label="Weighted UGX" value={formatAmount(panel.weighted)} />
      <StatTile label="Avg win" value={panel.avgWin === null ? "n/a" : `${panel.avgWin}%`} />
    </div>
  );
}

function TopAccounts({
  panel,
  onNavigate,
}: Readonly<{ panel: ProfilePanel | "error" | null; onNavigate: () => void }>) {
  if (panel === "error") {
    return <p className="text-sm text-(--c-muted)">Could not load accounts.</p>;
  }
  if (panel === null) {
    return (
      <div className="grid gap-2">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-10 rounded-lg" />
        ))}
      </div>
    );
  }
  if (panel.top.length === 0) {
    return <p className="text-sm text-(--c-muted)">No accounts with open pipeline yet.</p>;
  }
  return (
    <ul className="grid gap-1">
      {panel.top.map((account) => (
        <li key={account.id}>
          <Link
            href={`/console/accounts/${account.id}`}
            onClick={onNavigate}
            className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 transition-colors duration-150 ease-(--ease-out-strong) hover:bg-card/60"
          >
            <span className="grid min-w-0 gap-1">
              <span className="truncate text-sm leading-none font-medium">{account.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {account.openPursuits} open{" "}
                {account.openPursuits === 1 ? "pursuit" : "pursuits"}
                {[account.sector, account.unit].filter(Boolean).length > 0 &&
                  ` · ${[account.sector, account.unit].filter(Boolean).join(", ")}`}
              </span>
            </span>
            <span className="grid shrink-0 justify-items-end gap-1">
              <span className="text-sm leading-none tabular-nums">
                <span className="text-muted-foreground">UGX </span>
                {formatAmount(account.weighted)}
              </span>
              {account.probability !== null && (
                <ProbabilityMeter value={account.probability} />
              )}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

const THEMES = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
] as const;

function ThemeSwitch() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Theme">
      {THEMES.map((option) => {
        const active = (theme ?? "dark") === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(option.value)}
            className={`inline-flex h-7 cursor-pointer items-center rounded-full px-3 text-xs transition-[background-color,color,box-shadow] duration-150 ease-(--ease-out-strong) outline-none focus-visible:ring-2 focus-visible:ring-ring/60 ${
              active
                ? "bg-muted font-medium text-foreground shadow-(--pill-shadow)"
                : "text-(--subtle) hover:text-foreground"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
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

function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/);
  const first = words[0]?.[0] ?? "";
  const second = words.length > 1 ? (words[1][0] ?? "") : "";
  return (first + second).toUpperCase();
}
