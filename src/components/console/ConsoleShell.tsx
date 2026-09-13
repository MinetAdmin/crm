"use client";

import * as React from "react";

import { ChevronsUpDown, LogOut, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";

import { Logo } from "@/components/brand/Logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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
import { Input } from "@/components/ui/input";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

import { HEADER_ACTIONS_ID } from "./HeaderActions";
import { navFor, type NavItem } from "./nav";

type ConsoleUser = { name: string; email: string; role: string };

export function ConsoleShell({
  user,
  signOutAction,
  defaultSidebarOpen = true,
  children,
}: Readonly<{
  user: ConsoleUser;
  signOutAction: () => Promise<void>;
  defaultSidebarOpen?: boolean;
  children: React.ReactNode;
}>) {
  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={defaultSidebarOpen}>
        <ConsoleSidebar user={user} signOutAction={signOutAction} />
        <SidebarInset>
          <ConsoleHeader />
          <div className="flex-1 p-4 md:px-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}

function ConsoleSidebar({
  user,
  signOutAction,
}: Readonly<{ user: ConsoleUser; signOutAction: () => Promise<void> }>) {
  const pathname = usePathname();
  const items = navFor(user.role);

  return (
    <Sidebar collapsible="icon" className="border-none">
      <SidebarHeader className="h-14 justify-center">
        <SidebarMenu>
          <CenteredMenuItem>
            <SidebarMenuButton
              asChild
              className="hover:bg-transparent active:bg-transparent [&_svg]:size-6 group-data-[collapsible=icon]:p-1!"
            >
              <Link href="/console">
                <Logo size={24} />
                <span className="font-heading text-[15px] font-semibold tracking-tight whitespace-nowrap">
                  CRM <span className="font-medium text-muted-foreground">· Minet Uganda</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </CenteredMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="pt-4 pb-0 group-data-[collapsible=icon]:hidden">
          <SidebarGroupContent>
            <SidebarInput placeholder="Search" disabled title="Not built yet" />
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="group-data-[collapsible=icon]:pt-4">
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <NavEntry key={item.label} item={item} pathname={pathname} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <UserMenu user={user} signOutAction={signOutAction} />
      </SidebarFooter>
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
}: Readonly<{ item: NavItem; pathname: string }>) {
  if (!item.href) {
    return (
      <CenteredMenuItem>
        <SidebarMenuButton disabled tooltip={`${item.label} (not built yet)`}>
          <item.icon />
          <span>{item.label}</span>
        </SidebarMenuButton>
        <SidebarMenuBadge>soon</SidebarMenuBadge>
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
        className="data-active:bg-card data-active:ring-1 data-active:ring-border [&[data-active=true]_svg]:text-(--c-brand)"
      >
        <Link href={item.href}>
          <item.icon />
          <span>{item.label}</span>
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
      <DropdownMenuRadioGroup value={theme ?? "system"} onValueChange={setTheme}>
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
    <SidebarMenu>
      <CenteredMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" tooltip={user.name}>
              <Avatar className="size-8">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <span className="grid flex-1 text-left leading-tight">
                <span className="truncate text-sm font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.role.replaceAll("_", " ")}
                </span>
              </span>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="min-w-56">
            <DropdownMenuLabel className="font-normal">
              <span className="block truncate text-sm">{user.name}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {user.email}
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
      </CenteredMenuItem>
    </SidebarMenu>
  );
}

function ConsoleHeader() {
  const { state, isMobile } = useSidebar();
  const showHeaderSearch = state === "collapsed" && !isMobile;

  return (
    <header className="relative flex h-14 shrink-0 items-center gap-3 px-4 md:px-6">
      <SidebarTrigger className="-ml-1.5" />
      <HeaderCrumbs />
      {showHeaderSearch && (
        <div className="absolute left-1/2 w-full max-w-xs -translate-x-1/2">
          <Input placeholder="Search" disabled title="Not built yet" className="h-8" />
        </div>
      )}
      <div
        id={HEADER_ACTIONS_ID}
        className="ml-auto flex items-center gap-2"
      />
    </header>
  );
}

function HeaderCrumbs() {
  const pathname = usePathname();
  const { crumbs, page } = crumbsFor(pathname);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb) => (
          <React.Fragment key={crumb.href}>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={crumb.href}>{crumb.label}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </React.Fragment>
        ))}
        <BreadcrumbItem>
          <BreadcrumbPage>{page}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
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
