"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import type { FormSheetState } from "@/components/console/FormSheet";
import { ForbiddenError, assertCanWriteOpportunity, currentViewer } from "@/lib/viewer";
import { RuleError, addScheduleLine, changeStage, closeOpportunity } from "@/lib/opportunities";
import { completeAction, setNextAction } from "@/lib/activities";

async function actorId(): Promise<bigint> {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  return BigInt(session.user.id);
}

function text(form: FormData, field: string): string {
  const value = form.get(field);
  return typeof value === "string" ? value.trim() : "";
}

async function assertWritable(id: string): Promise<void> {
  await assertCanWriteOpportunity(await currentViewer(), id);
}

/** Turns a rule refusal into a message on the form it came from. */
function refusal(error: unknown): FormSheetState {
  if (error instanceof ForbiddenError) return { error: "Refused: not yours to change." };
  if (error instanceof RuleError) return { error: `Refused. ${error.message}` };
  throw error;
}

export async function submitStageChange(_state: FormSheetState, form: FormData): Promise<FormSheetState> {
  const id = text(form, "opportunityId");
  const probability = text(form, "probability");
  try {
    await assertWritable(id);
    await changeStage(
      {
        opportunityId: id,
        toStageId: text(form, "toStageId"),
        probability: probability ? Number(probability) : undefined,
        note: text(form, "note") || undefined,
      },
      await actorId(),
    );
  } catch (error) {
    return refusal(error);
  }
  revalidatePath(`/console/opportunities/${id}`);
  return { ok: true };
}

export async function submitScheduleLine(_state: FormSheetState, form: FormData): Promise<FormSheetState> {
  const id = text(form, "opportunityId");
  const amount = Number(text(form, "expectedAmount"));
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Refused by BR-RSL-01: an expected amount above zero is required." };
  }
  try {
    await assertWritable(id);
    await addScheduleLine(
      {
        opportunityId: id,
        productId: text(form, "productId"),
        effectiveMonth: text(form, "effectiveMonth"),
        expectedAmount: amount,
        revenueType: text(form, "revenueType") || "new_business",
      },
      await actorId(),
    );
  } catch (error) {
    return refusal(error);
  }
  revalidatePath(`/console/opportunities/${id}`);
  return { ok: true };
}

export async function submitClosure(_state: FormSheetState, form: FormData): Promise<FormSheetState> {
  const id = text(form, "opportunityId");
  try {
    await assertWritable(id);
    await closeOpportunity(
      {
        opportunityId: id,
        outcome: text(form, "outcome") as "won" | "lost" | "on_hold" | "withdrawn",
        reasonId: text(form, "reasonId") || undefined,
      },
      await actorId(),
    );
  } catch (error) {
    return refusal(error);
  }
  revalidatePath(`/console/opportunities/${id}`);
  return { ok: true };
}

export async function submitNextAction(_state: FormSheetState, form: FormData): Promise<FormSheetState> {
  const id = text(form, "opportunityId");
  const subject = text(form, "subject");
  const dueDate = text(form, "dueDate");
  if (!subject || !dueDate) return { error: "A subject and a due date are required." };

  await setNextAction({ opportunityId: id, subject, dueDate }, await actorId());
  revalidatePath(`/console/opportunities/${id}`);
  return { ok: true };
}

export async function submitActionDone(form: FormData) {
  const id = text(form, "opportunityId");
  const actionId = text(form, "actionId");
  if (actionId) {
    await completeAction(actionId, await actorId());
    revalidatePath(`/console/opportunities/${id}`);
  }
  redirect(`/console/opportunities/${id}`);
}
