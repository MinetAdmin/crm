"use client";

import * as React from "react";

import { LogOut, Moon, Search, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";

import { Logo } from "@/components/brand/Logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

import { HEADER_ACTIONS_ID } from "./HeaderActions";
import { navFor, navSectionsFor, type NavItem } from "./nav";

type ConsoleUser = { name: string; email: string; role: string };

type NavCounts = Readonly<Record<string, number>>;

export function ConsoleShell({
  user,
  signOutAction,
  defaultSidebarOpen = true,
  counts = {},
  children,
}: Readonly<{
  user: ConsoleUser;
  signOutAction: () => Promise<void>;
  defaultSidebarOpen?: boolean;
  counts?: NavCounts;
  children: React.ReactNode;
}>) {
  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={defaultSidebarOpen}>
        <ConsoleSidebar user={user} counts={counts} />
        <SidebarInset>
          <ConsoleHeader user={user} signOutAction={signOutAction} />
          <div className="flex-1 p-4 md:px-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}

function ConsoleSidebar({
  user,
  counts,
}: Readonly<{ user: ConsoleUser; counts: NavCounts }>) {
  const pathname = usePathname();
  const sections = navSectionsFor(user.role);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border bg-sidebar-accent p-3 group-data-[collapsible=icon]:p-2">
        <SidebarMenu>
          <CenteredMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              className="hover:bg-transparent active:bg-transparent group-data-[collapsible=icon]:p-0!"
            >
              <Link href="/console">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-secondary shadow-(--pill-shadow)">
                  <Logo size={18} />
                </span>
                <span className="grid min-w-0 flex-1 gap-1 leading-none">
                  <span className="truncate text-sm font-medium">Minet CRM</span>
                  <span className="truncate text-xs text-(--subtle)">Business development</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </CenteredMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {sections.map((section) => (
          <SidebarGroup
            key={section.label ?? "main"}
            className="border-b border-sidebar-border px-3 py-2 last:border-b-0 group-data-[collapsible=icon]:px-2"
          >
            {section.label && (
              <SidebarGroupLabel className="h-6 px-2 text-[11px] font-medium tracking-[0.08em] text-(--subtle) uppercase">
                {section.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {section.items.map((item) => (
                  <NavEntry
                    key={item.label}
                    item={item}
                    pathname={pathname}
                    count={item.href ? counts[item.href] : undefined}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

function CenteredMenuItem({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SidebarMenuItem className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
      {children}
    </SidebarMenuItem>
  );
}

function NavEntry({
  item,
  pathname,
  count,
}: Readonly<{ item: NavItem; pathname: string; count?: number }>) {
  if (!item.href) {
    return (
      <CenteredMenuItem>
        <SidebarMenuButton disabled tooltip={`${item.label} (not built yet)`}>
          <item.icon />
          <span>{item.label}</span>
        </SidebarMenuButton>
      </CenteredMenuItem>
    );
  }

  const active =
    item.href === "/console"
      ? pathname === "/console"
      : pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <CenteredMenuItem>
      <SidebarMenuButton
        asChild
        isActive={active}
        tooltip={item.label}
        className="h-[30px] rounded-lg text-sidebar-foreground transition-[background-color,color,box-shadow] duration-150 ease-(--ease-out-strong) hover:bg-transparent hover:text-foreground data-active:h-8 data-active:bg-sidebar-primary data-active:text-foreground data-active:shadow-(--pill-shadow) [&_svg]:size-3.5 [&_svg]:text-(--subtle) [&[data-active=true]_svg]:text-(--icon)"
      >
        <Link href={item.href}>
          <item.icon />
          <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
          {count !== undefined && (
            <span className="inline-flex h-4 min-w-6 shrink-0 items-center justify-center rounded-full border border-(--faint)/50 bg-muted px-1 text-[11px] leading-none text-(--chip) tabular-nums group-data-[collapsible=icon]:hidden">
              {count}
            </span>
          )}
        </Link>
      </SidebarMenuButton>
    </CenteredMenuItem>
  );
}

function ThemeItems() {
  const { theme, setTheme } = useTheme();
  return (
    <>
      <DropdownMenuLabel className="flex items-center gap-2 font-normal text-muted-foreground">
        <Sun className="size-3.5 dark:hidden" />
        <Moon className="hidden size-3.5 dark:block" />
        Theme
      </DropdownMenuLabel>
      <DropdownMenuRadioGroup value={theme ?? "dark"} onValueChange={setTheme}>
        <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </>
  );
}

function UserMenu({
  user,
  signOutAction,
}: Readonly<{ user: ConsoleUser; signOutAction: () => Promise<void> }>) {
  const initials = user.name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
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
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end" className="min-w-56">
        <DropdownMenuLabel className="font-normal">
          <span className="block truncate text-sm">{user.name}</span>
          <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {user.role.replaceAll("_", " ")}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ThemeItems />
        <DropdownMenuSeparator />
        <form action={signOutAction}>
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full">
              <LogOut />
              Sign out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ConsoleHeader({
  user,
  signOutAction,
}: Readonly<{ user: ConsoleUser; signOutAction: () => Promise<void> }>) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger className="-ml-1.5" />
        <HeaderTitle />
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <div id={HEADER_ACTIONS_ID} className="flex items-center gap-2" />
        <button
          type="button"
          aria-label="Search (not built yet)"
          title="Not built yet"
          disabled
          className="inline-flex size-[30px] shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-(--pill-shadow) disabled:opacity-50"
        >
          <Search className="size-3.5" aria-hidden />
        </button>
        <UserMenu user={user} signOutAction={signOutAction} />
      </div>
    </header>
  );
}

const PAGE_STATUS: Readonly<Record<string, string>> = {
  "/console/accounts": "Active",
};

function HeaderTitle() {
  const pathname = usePathname();
  const { crumbs, page } = crumbsFor(pathname);
  const status = PAGE_STATUS[pathname];

  return (
    <div className="flex min-w-0 items-center gap-2">
      {crumbs.slice(1).map((crumb) => (
        <React.Fragment key={crumb.href}>
          <Link
            href={crumb.href}
            className="truncate text-xs text-(--subtle) transition-colors duration-150 hover:text-foreground"
          >
            {crumb.label}
          </Link>
          <span aria-hidden className="text-xs text-(--faint)">
            /
          </span>
        </React.Fragment>
      ))}
      <h1 className="truncate text-[16px] leading-none font-medium">{page}</h1>
      {status && (
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-(--faint)/50 bg-muted py-[3px] pr-[7px] pl-[6px] text-[11px] leading-none">
          <span aria-hidden className="size-2 rounded-full bg-(--status)" />
          {status}
        </span>
      )}
    </div>
  );
}

function crumbsFor(pathname: string): {
  crumbs: Array<{ label: string; href: string }>;
  page: string;
} {
  const crumbs = [{ label: "Console", href: "/console" }];
  const section = navFor("admin").find(
    (item) =>
      item.href &&
      item.href !== "/console" &&
      (pathname === item.href || pathname.startsWith(`${item.href}/`)),
  );
  if (!section?.href) return { crumbs, page: "Dashboard" };

  const rest = pathname.slice(section.href.length).split("/").filter(Boolean);
  if (rest.length === 0) return { crumbs, page: section.label };

  crumbs.push({ label: section.label, href: section.href });
  return { crumbs, page: prettify(rest[rest.length - 1]) };
}

function prettify(segment: string): string {
  const text = decodeURIComponent(segment).replaceAll("-", " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}
