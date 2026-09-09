import Link from "next/link";

import { EmptyState, PrimaryLink } from "@/components/console/ui";
import { leadAgeDays } from "@/lib/lead-rules";
import { listLeads } from "@/lib/leads";

const STATUSES = ["new", "contacted", "qualifying", "qualified", "disqualified", "converted"];

export default async function LeadsPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ status?: string }> }>) {
  const { status } = await searchParams;
  const leads = await listLeads(status);
  const now = new Date();

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-3">
        <nav className="flex min-w-0 flex-1 flex-wrap gap-1" aria-label="Filter by status">
          <FilterLink label="All" active={!status} href="/console/leads" />
          {STATUSES.map((value) => (
            <FilterLink
              key={value}
              label={value}
              active={status === value}
              href={`/console/leads?status=${value}`}
            />
          ))}
        </nav>
        <span className="text-sm tabular-nums text-(--c-muted)">
          {leads.length} {leads.length === 1 ? "lead" : "leads"}
        </span>
        <PrimaryLink href="/console/leads/new">New lead</PrimaryLink>
      </div>

      {leads.length === 0 ? (
        <div className="mt-4">
          <EmptyState>
            {status ? `No ${status} leads.` : "No leads yet. Unassigned leads are the ones that die."}
          </EmptyState>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-md border border-(--c-line) bg-(--c-surface)">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-(--c-line-soft) text-left text-[13px] text-(--c-muted)">
                <th className="px-4 py-2.5 font-medium">Company</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Source</th>
                <th className="px-4 py-2.5 font-medium">Owner</th>
                <th className="px-4 py-2.5 font-medium">Unit</th>
                <th className="px-4 py-2.5 text-right font-medium">Age</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => {
                const age = leadAgeDays(lead.createdAt, now);
                return (
                  <tr key={lead.id} className="border-b border-(--c-line-soft) last:border-b-0">
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/console/leads/${lead.id}`}
                        className="font-medium underline-offset-2 hover:underline"
                      >
                        {lead.companyName}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-(--c-muted)">{lead.status}</td>
                    <td className="px-4 py-2.5 text-(--c-muted)">{lead.source}</td>
                    <td className="px-4 py-2.5 text-(--c-muted)">{lead.owner}</td>
                    <td className="px-4 py-2.5 text-(--c-muted)">{lead.unit}</td>
                    <td
                      className={`px-4 py-2.5 text-right tabular-nums ${
                        age >= 30 ? "text-(--c-warn)" : "text-(--c-muted)"
                      }`}
                    >
                      {age}d
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FilterLink({
  label,
  href,
  active,
}: Readonly<{ label: string; href: string; active: boolean }>) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-md px-2.5 py-1.5 text-sm ${
        active ? "bg-(--c-wash) font-medium" : "text-(--c-muted) hover:bg-(--c-wash)"
      }`}
    >
      {label}
    </Link>
  );
}
