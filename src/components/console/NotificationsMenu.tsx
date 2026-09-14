"use client";

import * as React from "react";

import { Bell } from "lucide-react";
import Link from "next/link";

import { getRecentActivity, type ActivityItem } from "@/app/console/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { formatShortDate } from "@/lib/format";

export function NotificationsMenu({ unread }: Readonly<{ unread: boolean }>) {
  const [items, setItems] = React.useState<ActivityItem[] | "error" | null>(null);

  const load = (open: boolean) => {
    if (!open || items !== null) return;
    getRecentActivity()
      .then(setItems)
      .catch(() => setItems("error"));
  };

  return (
    <DropdownMenu onOpenChange={load}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={unread ? "Notifications, new activity" : "Notifications"}
          className="relative inline-flex size-[30px] shrink-0 cursor-pointer items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-(--pill-shadow) transition-[background-color,box-shadow,scale] duration-150 ease-(--ease-out-strong) outline-none select-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/60 active:scale-[0.96] data-[state=open]:bg-muted"
        >
          <Bell className="size-3.5" aria-hidden />
          {unread && (
            <span
              aria-hidden
              className="absolute top-[7px] right-[7px] size-1.5 rounded-full bg-(--danger) ring-2 ring-secondary"
            />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="text-sm font-medium">Recent activity</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ActivityList items={items} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ActivityList({
  items,
}: Readonly<{ items: ActivityItem[] | "error" | null }>) {
  if (items === "error") {
    return (
      <p className="px-2 py-3 text-sm text-(--c-muted)">Could not load recent activity.</p>
    );
  }
  if (items === null) {
    return (
      <div className="grid gap-1 p-1">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-10 rounded-md" />
        ))}
      </div>
    );
  }
  if (items.length === 0) {
    return <p className="px-2 py-3 text-sm text-(--c-muted)">No stage movements yet.</p>;
  }
  return (
    <>
      {items.map((item) => (
        <DropdownMenuItem key={item.id} asChild>
          <Link href={`/console/accounts/${item.accountId}`} className="grid gap-1">
            <span className="text-sm leading-snug">
              <span className="font-medium">{item.actor}</span> moved{" "}
              <span className="font-medium">{item.account}</span> to {item.stage}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatShortDate(item.changedAt)}
            </span>
          </Link>
        </DropdownMenuItem>
      ))}
    </>
  );
}
