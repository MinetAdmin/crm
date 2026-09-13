import {
  Building2,
  ChartColumn,
  ClipboardList,
  FileText,
  Flag,
  LayoutGrid,
  Route,
  Settings2,
  Target,
  TrendingUp,
  UserRoundPlus,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  icon: LucideIcon;
  href?: string;
  adminOnly?: boolean;
};

export const NAV: ReadonlyArray<NavItem> = [
  { label: "Dashboard", icon: LayoutGrid, href: "/console" },
  { label: "Accounts", icon: Building2, href: "/console/accounts" },
  { label: "Longlist", icon: ClipboardList, href: "/console/longlist" },
  { label: "Leads", icon: UserRoundPlus, href: "/console/leads" },
  { label: "Opportunities", icon: TrendingUp, href: "/console/opportunities" },
  { label: "Initiatives", icon: Flag, href: "/console/initiatives" },
  { label: "Tenders", icon: FileText, href: "/console/tenders" },
  { label: "Targets", icon: Target, href: "/console/targets" },
  { label: "Reports", icon: ChartColumn, href: "/console/reports" },
  { label: "Roadmap", icon: Route, href: "/console/roadmap" },
  { label: "Admin", icon: Settings2, href: "/console/admin", adminOnly: true },
];

export function navFor(role: string): ReadonlyArray<NavItem> {
  return NAV.filter((item) => !item.adminOnly || role === "admin");
}
