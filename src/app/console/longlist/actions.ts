"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import type { FormSheetState } from "@/components/console/FormSheet";
import { db } from "@/lib/db";
import {
  createLonglistEntries,
  promoteLonglistEntry,
  setLonglistStatus,
} from "@/lib/longlist";

async function actorId(): Promise<bigint> {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  return BigInt(session.user.id);
}

function text(form: FormData, field: string): string {
  const value = form.get(field);
  return typeof value === "string" ? value.trim() : "";
}

export async function submitNames(_state: FormSheetState, form: FormData): Promise<FormSheetState> {
  const names = text(form, "names")
    .split("\n")
    .map((name) => name.trim())
    .filter(Boolean);
  if (names.length === 0) return { error: "At least one company name is required." };

  const track = text(form, "track") === "planned" ? ("planned" as const) : ("anytime" as const);
  const planYear = Number(text(form, "planYear"));
  if (track === "planned" && !Number.isInteger(planYear)) {
    return { error: "BR-LL-01: a planned entry names its budget year." };
  }

  await createLonglistEntries(
    {
      names,
      track,
      planYear: track === "planned" ? planYear : undefined,
      source: text(form, "source") || undefined,
      unitId: text(form, "unitId") || undefined,
      sectorId: text(form, "sectorId") || undefined,
    },
    await actorId(),
  );
  revalidatePath("/console/longlist");
  return { ok: true };
}

export async function submitPromote(_state: FormSheetState, form: FormData): Promise<FormSheetState> {
  const entryId = text(form, "entryId");
  const sourceId = text(form, "sourceId");
  const unitId = text(form, "unitId");
  const ownerId = text(form, "ownerId");
  if (!entryId) return { error: "The entry is missing." };
  if (!sourceId || !unitId || !ownerId) {
    return { error: "Source, unit and owner are all required for a lead." };
  }

  const entry = await db().longlist_entry.findFirst({
    where: { id: BigInt(entryId), archived_at: null },
  });
  if (!entry) return { error: "That entry no longer exists." };
  if (entry.status === "picked") return { error: "Already promoted to a lead." };

  const estimated = Number(text(form, "estimatedValue"));
  const leadId = await promoteLonglistEntry(
    {
      entryId,
      lead: {
        companyName: entry.company_name,
        matchedAccountId: entry.matched_account_id?.toString(),
        sourceId,
        unitId,
        sectorId: text(form, "sectorId") || undefined,
        estimatedValue: Number.isFinite(estimated) && estimated > 0 ? estimated : undefined,
        ownerId,
        productIds: [],
      },
    },
    await actorId(),
  );
  revalidatePath("/console/longlist");
  revalidatePath("/console/leads");
  redirect(`/console/leads/${leadId}`);
}

export async function submitDrop(_state: FormSheetState, form: FormData): Promise<FormSheetState> {
  const entryId = text(form, "entryId");
  const reason = text(form, "reason");
  if (!entryId) return { error: "The entry is missing." };
  if (!reason) return { error: "BR-LL-03: dropping a name requires saying why." };

  await setLonglistStatus({ entryId, status: "dropped", dropReason: reason }, await actorId());
  revalidatePath("/console/longlist");
  return { ok: true };
}

export async function submitPark(form: FormData) {
  const entryId = text(form, "entryId");
  if (entryId) {
    await setLonglistStatus({ entryId, status: "parked" }, await actorId());
    revalidatePath("/console/longlist");
  }
  redirect("/console/longlist");
}

export async function submitRestore(form: FormData) {
  const entryId = text(form, "entryId");
  if (entryId) {
    await setLonglistStatus({ entryId, status: "unworked" }, await actorId());
    revalidatePath("/console/longlist");
  }
  redirect("/console/longlist");
}
