import { notFound } from "next/navigation";

import {
  BackLink,
  CheckboxField,
  EmptyState,
  PrimaryButton,
  TextField,
} from "@/components/console/ui";
import { getAccount } from "@/lib/accounts";
import { submitContact } from "../actions";

export default async function AccountPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const account = await getAccount(id);
  if (!account) notFound();

  return (
    <div className="w-full max-w-4xl">
      <BackLink href="/console/accounts">Accounts</BackLink>

      <h1 className="mt-3 text-2xl font-semibold tracking-[-0.01em]">{account.name}</h1>
      <p className="mt-1 text-sm text-(--c-muted)">
        {account.unit?.name ?? "No unit"} · {account.sector?.code ?? "No sector"} ·{" "}
        {account.country}
      </p>

      <section className="mt-6">
        <h2 className="text-[15px] font-semibold">Contacts</h2>
        {account.contact.length === 0 ? (
          <div className="mt-3">
            <EmptyState>No contacts yet. A lead cannot be qualified without one.</EmptyState>
          </div>
        ) : (
          <ul className="mt-3 grid gap-px overflow-hidden rounded-md border border-(--c-line) bg-(--c-surface)">
            {account.contact.map((contact) => (
              <li
                key={contact.id.toString()}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-(--c-line-soft) px-4 py-3 last:border-b-0"
              >
                <span className="text-sm font-medium">
                  {contact.full_name}
                  {contact.is_decision_maker && (
                    <span className="ml-2 rounded border border-(--c-line) px-1.5 py-0.5 text-[11px] font-normal text-(--c-muted)">
                      decision maker
                    </span>
                  )}
                </span>
                <span className="text-[13px] text-(--c-muted)">
                  {[contact.role_title, contact.email, contact.phone].filter(Boolean).join(" · ") ||
                    "No details"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 rounded-md border border-(--c-line) bg-(--c-surface) p-5">
        <h2 className="text-[15px] font-semibold">Add a contact</h2>
        <form action={submitContact} className="mt-4 grid gap-4">
          <input type="hidden" name="accountId" value={account.id.toString()} />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Full name" name="fullName" required />
            <TextField label="Role" name="roleTitle" />
            <TextField label="Email" name="email" type="email" />
            <TextField label="Phone" name="phone" />
          </div>
          <CheckboxField label="Decision maker" name="isDecisionMaker" />
          <div>
            <PrimaryButton>Add contact</PrimaryButton>
          </div>
        </form>
      </section>
    </div>
  );
}
