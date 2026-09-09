/**
 * The console's sections, in the order doc 07 §1 sets out. Only the dashboard
 * exists so far; the rest are listed but marked unavailable rather than linked
 * to nothing, so the shell shows the shape of the product honestly.
 */
export type NavItem = {
  label: string;
  href?: string;
  adminOnly?: boolean;
};

export const NAV: ReadonlyArray<NavItem> = [
  { label: "Dashboard", href: "/" },
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
