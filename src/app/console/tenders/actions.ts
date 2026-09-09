"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { TenderRuleError, changeTenderStatus, createTender } from "@/lib/tenders";
import type { ValueBasis } from "@/lib/tender-rules";

async function actorId(): Promise<bigint> {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  return BigInt(session.user.id);
}

function text(form: FormData, field: string): string {
  const value = form.get(field);
  return typeof value === "string" ? value.trim() : "";
}

export async function submitTender(form: FormData) {
  const value = Number(text(form, "recordedValue"));
  if (!text(form, "title") || !Number.isFinite(value) || value <= 0) {
    redirect("/console/tenders/new?error=required");
  }
  const id = await createTender(
    {
      tenderType: text(form, "tenderType") === "prequalification" ? "prequalification" : "tender",
      issuingBody: text(form, "issuingBody"),
      title: text(form, "title"),
      sectorId: text(form, "sectorId"),
      unitId: text(form, "unitId"),
      recordedValue: value,
      valueBasis: text(form, "valueBasis") as ValueBasis,
      submissionDeadline: text(form, "submissionDeadline") || undefined,
      parentId: text(form, "parentId") || undefined,
    },
    await actorId(),
  );
  revalidatePath("/console/tenders");
  redirect(`/console/tenders/${id}`);
}

export async function submitTenderStatus(form: FormData) {
  const id = text(form, "tenderId");
  try {
    await changeTenderStatus(
      {
        tenderId: id,
        status: text(form, "status"),
        outcomeReasonId: text(form, "outcomeReasonId") || undefined,
      },
      await actorId(),
    );
  } catch (error) {
    if (error instanceof TenderRuleError) redirect(`/console/tenders/${id}?blocked=BR-TEN-02`);
    throw error;
  }
  revalidatePath(`/console/tenders/${id}`);
  redirect(`/console/tenders/${id}`);
}
