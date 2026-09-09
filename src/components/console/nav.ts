/** The console's sections in the order doc 07 §1 sets out. No href means unbuilt. */
export type NavItem = {
  label: string;
  href?: string;
  adminOnly?: boolean;
};

export const NAV: ReadonlyArray<NavItem> = [
  { label: "Dashboard", href: "/console" },
  { label: "Leads" },
  { label: "Opportunities" },
  { label: "Initiatives" },
  { label: "Tenders" },
  { label: "Targets" },
  { label: "Reports" },
  { label: "Admin", adminOnly: true },
];

export function navFor(role: string): ReadonlyArray<NavItem> {
  return NAV.filter((item) => !item.adminOnly || role === "admin");
}
