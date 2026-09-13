"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import type { FormSheetState } from "@/components/console/FormSheet";
import { addInitiativeNote, createInitiative, linkOpportunity } from "@/lib/initiatives";

async function actorId(): Promise<bigint> {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  return BigInt(session.user.id);
}

function text(form: FormData, field: string): string {
  const value = form.get(field);
  return typeof value === "string" ? value.trim() : "";
}

export async function submitInitiative(_state: FormSheetState, form: FormData): Promise<FormSheetState> {
  const name = text(form, "name");
  const target = Number(text(form, "annualTarget"));
  if (!name || !Number.isFinite(target) || target <= 0) {
    return { error: "A name and an annual target above zero are required." };
  }
  const id = await createInitiative(
    {
      name,
      unitId: text(form, "unitId"),
      sectorId: text(form, "sectorId"),
      championId: text(form, "championId"),
      statusId: text(form, "statusId"),
      annualTarget: target,
      targetYear: Number(text(form, "targetYear")) || new Date().getFullYear(),
    },
    await actorId(),
  );
  revalidatePath("/console/initiatives");
  redirect(`/console/initiatives/${id}`);
}

export async function submitNote(_state: FormSheetState, form: FormData): Promise<FormSheetState> {
  const initiativeId = text(form, "initiativeId");
  const body = text(form, "body");
  if (!initiativeId || !body) return { error: "A note needs a body." };

  await addInitiativeNote({ initiativeId, body }, await actorId());
  revalidatePath(`/console/initiatives/${initiativeId}`);
  return { ok: true };
}

export async function submitOpportunityLink(form: FormData) {
  const opportunityId = text(form, "opportunityId");
  const initiativeId = text(form, "initiativeId");
  await linkOpportunity({ opportunityId, initiativeId: initiativeId || null }, await actorId());
  revalidatePath(`/console/opportunities/${opportunityId}`);
  redirect(`/console/opportunities/${opportunityId}`);
}
