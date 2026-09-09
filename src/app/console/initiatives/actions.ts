"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
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

export async function submitInitiative(form: FormData) {
  const name = text(form, "name");
  const target = Number(text(form, "annualTarget"));
  if (!name || !Number.isFinite(target) || target <= 0) {
    redirect("/console/initiatives/new?error=required");
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

export async function submitNote(form: FormData) {
  const initiativeId = text(form, "initiativeId");
  const body = text(form, "body");
  if (initiativeId && body) {
    await addInitiativeNote({ initiativeId, body }, await actorId());
    revalidatePath(`/console/initiatives/${initiativeId}`);
  }
  redirect(`/console/initiatives/${initiativeId}`);
}

export async function submitOpportunityLink(form: FormData) {
  const opportunityId = text(form, "opportunityId");
  const initiativeId = text(form, "initiativeId");
  await linkOpportunity({ opportunityId, initiativeId: initiativeId || null }, await actorId());
  revalidatePath(`/console/opportunities/${opportunityId}`);
  redirect(`/console/opportunities/${opportunityId}`);
}
