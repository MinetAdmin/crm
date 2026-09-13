import Link from "next/link";

import { EmptyState } from "@/components/console/ui";
import { Input } from "@/components/ui/input";
import { listAccounts } from "@/lib/accounts";
import { db } from "@/lib/db";
import { NewAccountSheet } from "./NewAccountSheet";

export default async function AccountsPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ q?: string }> }>) {
  const { q } = await searchParams;
  const [accounts, units, sectors] = await Promise.all([
    listAccounts(q),
    db().unit.findMany({ where: { active: true }, orderBy: { code: "asc" } }),
    db().sector.findMany({ where: { active: true }, orderBy: { code: "asc" } }),
  ]);

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-3">
        <form role="search" className="min-w-0 flex-1">
          <Input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search accounts"
            aria-label="Search accounts by name"
            className="max-w-md"
          />
        </form>
        <span className="text-sm text-(--c-muted) tabular-nums">
          {accounts.length} {accounts.length === 1 ? "account" : "accounts"}
        </span>
        <NewAccountSheet
          units={units.map((unit) => ({ value: unit.id.toString(), label: unit.name }))}
          sectors={sectors.map((sector) => ({ value: sector.id.toString(), label: sector.code }))}
        />
      </div>

      {accounts.length === 0 ? (
        <div className="mt-4">
          <EmptyState>
            {q ? `No account matches “${q}”.` : "No accounts yet. The first one starts here."}
          </EmptyState>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-md border border-(--c-line) bg-(--c-surface)">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-(--c-line-soft) text-left text-[13px] text-(--c-muted)">
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Unit</th>
                <th className="px-4 py-2.5 font-medium">Sector</th>
                <th className="px-4 py-2.5 text-right font-medium">Contacts</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id} className="border-b border-(--c-line-soft) last:border-b-0">
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/console/accounts/${account.id}`}
                      className="font-medium underline-offset-2 hover:underline"
                    >
                      {account.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-(--c-muted)">{account.unit ?? "—"}</td>
                  <td className="px-4 py-2.5 text-(--c-muted)">{account.sector ?? "—"}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-(--c-muted)">
                    {account.contacts}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
