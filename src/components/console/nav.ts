/** The console's sections in the order doc 07 §1 sets out. No href means unbuilt. */
export type NavItem = {
  label: string;
  href?: string;
  adminOnly?: boolean;
};

export const NAV: ReadonlyArray<NavItem> = [
  { label: "Dashboard", href: "/console" },
  { label: "Accounts", href: "/console/accounts" },
  { label: "Leads", href: "/console/leads" },
  { label: "Opportunities", href: "/console/opportunities" },
  { label: "Initiatives", href: "/console/initiatives" },
  { label: "Tenders", href: "/console/tenders" },
  { label: "Targets" },
  { label: "Reports" },
  { label: "Admin", adminOnly: true },
];

export function navFor(role: string): ReadonlyArray<NavItem> {
  return NAV.filter((item) => !item.adminOnly || role === "admin");
}
