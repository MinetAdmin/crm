"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { createAccount, createContact, duplicatesFor } from "@/lib/accounts";

async function actorId(): Promise<bigint> {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  return BigInt(session.user.id);
}

function text(form: FormData, field: string): string {
  const value = form.get(field);
  return typeof value === "string" ? value.trim() : "";
}

export async function submitAccount(form: FormData) {
  const name = text(form, "name");
  if (!name) redirect("/console/accounts/new?error=name");

  const params = new URLSearchParams({ name });
  const sectorId = text(form, "sectorId");
  const unitId = text(form, "unitId");
  if (sectorId) params.set("sectorId", sectorId);
  if (unitId) params.set("unitId", unitId);

  // The prompt is a warning, not a block: confirmed means the person looked
  // at the candidates and says this is a different client.
  if (text(form, "confirmed") !== "yes") {
    const duplicates = await duplicatesFor(name);
    if (duplicates.length > 0) {
      params.set("duplicates", duplicates.map((d) => d.id).join(","));
      redirect(`/console/accounts/new?${params}`);
    }
  }

  const id = await createAccount(
    { name, sectorId: sectorId || undefined, unitId: unitId || undefined },
    await actorId(),
  );
  revalidatePath("/console/accounts");
  redirect(`/console/accounts/${id}`);
}

export async function submitContact(form: FormData) {
  const accountId = text(form, "accountId");
  const fullName = text(form, "fullName");
  if (!accountId) redirect("/console/accounts");
  if (!fullName) redirect(`/console/accounts/${accountId}?error=name`);

  await createContact(
    {
      accountId,
      fullName,
      roleTitle: text(form, "roleTitle") || undefined,
      email: text(form, "email") || undefined,
      phone: text(form, "phone") || undefined,
      isDecisionMaker: form.get("isDecisionMaker") === "on",
    },
    await actorId(),
  );
  revalidatePath(`/console/accounts/${accountId}`);
  redirect(`/console/accounts/${accountId}`);
}
