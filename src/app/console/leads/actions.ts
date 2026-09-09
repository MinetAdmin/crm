"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { convertLead, createLead } from "@/lib/leads";

async function actorId(): Promise<bigint> {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  return BigInt(session.user.id);
}

function text(form: FormData, field: string): string {
  const value = form.get(field);
  return typeof value === "string" ? value.trim() : "";
}

export async function submitLead(form: FormData) {
  const companyName = text(form, "companyName");
  const sourceId = text(form, "sourceId");
  const unitId = text(form, "unitId");
  const ownerId = text(form, "ownerId");
  if (!companyName || !sourceId || !unitId || !ownerId) {
    redirect("/console/leads/new?error=required");
  }

  const estimated = Number(text(form, "estimatedValue"));
  const id = await createLead(
    {
      companyName,
      matchedAccountId: text(form, "matchedAccountId") || undefined,
      contactName: text(form, "contactName") || undefined,
      contactEmail: text(form, "contactEmail") || undefined,
      contactPhone: text(form, "contactPhone") || undefined,
      sourceId,
      unitId,
      sectorId: text(form, "sectorId") || undefined,
      estimatedValue: Number.isFinite(estimated) && estimated > 0 ? estimated : undefined,
      ownerId,
      productIds: form.getAll("productIds").filter((v): v is string => typeof v === "string"),
    },
    await actorId(),
  );
  revalidatePath("/console/leads");
  redirect(`/console/leads/${id}`);
}

export async function submitConversion(form: FormData) {
  const leadId = text(form, "leadId");
  if (!leadId) redirect("/console/leads");

  const opportunityId = await convertLead(
    {
      leadId,
      name: text(form, "name"),
      sectorId: text(form, "sectorId"),
      stageId: text(form, "stageId"),
      expectedCloseDate: text(form, "expectedCloseDate"),
    },
    await actorId(),
  );
  revalidatePath(`/console/leads/${leadId}`);
  redirect(`/console/leads/${leadId}?converted=${opportunityId}`);
}
