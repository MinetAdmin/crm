import { notFound } from "next/navigation";

import { accountPanelStats, getAccount } from "@/lib/accounts";

import { AccountDetailSheet } from "../../AccountDetailSheet";

export default async function AccountDetailInterception({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const [account, stats] = await Promise.all([getAccount(id), accountPanelStats(id)]);
  if (!account) notFound();

  return (
    <AccountDetailSheet
      account={{
        id: account.id.toString(),
        name: account.name,
        unit: account.unit?.code ?? null,
        sector: account.sector?.code ?? null,
        country: account.country,
        createdAt: account.created_at.toISOString().slice(0, 10),
        contacts: account.contact.map((contact) => ({
          id: contact.id.toString(),
          name: contact.full_name,
          role: contact.role_title,
          email: contact.email,
          phone: contact.phone,
          decisionMaker: contact.is_decision_maker,
        })),
      }}
      stats={stats}
    />
  );
}
