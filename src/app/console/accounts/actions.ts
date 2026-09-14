"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import type { FormSheetState } from "@/components/console/FormSheet";
import { Prisma } from "@prisma/client";

import {
  createAccount,
  createContact,
  duplicatesFor,
  mergeAccounts,
  updateAccount,
} from "@/lib/accounts";

async function actorId(): Promise<bigint> {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  return BigInt(session.user.id);
}

function text(form: FormData, field: string): string {
  const value = form.get(field);
  return typeof value === "string" ? value.trim() : "";
}

export async function submitAccount(_state: FormSheetState, form: FormData): Promise<FormSheetState> {
  const name = text(form, "name");
  if (!name) return { error: "A name is required." };

  // The prompt is a warning, not a block: confirmed means the person looked
  // at the candidates and says this is a different client.
  if (text(form, "confirmed") !== "yes") {
    const duplicates = await duplicatesFor(name);
    if (duplicates.length > 0) return { duplicates };
  }

  const sectorId = text(form, "sectorId");
  const unitId = text(form, "unitId");
  const id = await createAccount(
    { name, sectorId: sectorId || undefined, unitId: unitId || undefined },
    await actorId(),
  );
  revalidatePath("/console/accounts");
  redirect(`/console/accounts/${id}`);
}

export async function submitAccountEdit(
  _state: FormSheetState,
  form: FormData,
): Promise<FormSheetState> {
  const accountId = text(form, "accountId");
  const name = text(form, "name");
  if (!accountId) return { error: "The account is missing." };
  if (!name) return { error: "A name is required." };

  try {
    await updateAccount(
      accountId,
      {
        name,
        sectorId: text(form, "sectorId") || undefined,
        unitId: text(form, "unitId") || undefined,
      },
      await actorId(),
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "An active account with this name already exists (FR-ACC-02)." };
    }
    throw error;
  }
  revalidatePath("/console/accounts");
  revalidatePath(`/console/accounts/${accountId}`);
  return { ok: true };
}

export async function submitAccountMerge(
  _state: FormSheetState,
  form: FormData,
): Promise<FormSheetState> {
  const accountId = text(form, "accountId");
  const survivorId = text(form, "survivorId");
  if (!accountId) return { error: "The account is missing." };
  if (!survivorId) return { error: "Pick the surviving account." };
  if (survivorId === accountId) return { error: "An account cannot merge into itself." };
  if (form.get("confirmed") !== "on") {
    return { error: "Confirm that this account will be archived." };
  }

  await mergeAccounts(accountId, survivorId, await actorId());
  revalidatePath("/console/accounts");
  redirect(`/console/accounts/${survivorId}`);
}

export async function submitContact(_state: FormSheetState, form: FormData): Promise<FormSheetState> {
  const accountId = text(form, "accountId");
  const fullName = text(form, "fullName");
  if (!accountId) return { error: "The account is missing." };
  if (!fullName) return { error: "A full name is required." };

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
  return { ok: true };
}
