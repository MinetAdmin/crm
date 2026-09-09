"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
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

/** Turns a rule refusal into a message on the record it came from. */
function backWithViolations(id: string, error: unknown): never {
  if (error instanceof RuleError) {
    const rules = error.violations.map((v) => v.rule).join(",");
    redirect(`/console/opportunities/${id}?blocked=${encodeURIComponent(rules)}`);
  }
  throw error;
}

export async function submitStageChange(form: FormData) {
  const id = text(form, "opportunityId");
  const probability = text(form, "probability");
  try {
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
    backWithViolations(id, error);
  }
  revalidatePath(`/console/opportunities/${id}`);
  redirect(`/console/opportunities/${id}`);
}

export async function submitScheduleLine(form: FormData) {
  const id = text(form, "opportunityId");
  const amount = Number(text(form, "expectedAmount"));
  if (!Number.isFinite(amount) || amount <= 0) {
    redirect(`/console/opportunities/${id}?blocked=BR-RSL-01`);
  }
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
  revalidatePath(`/console/opportunities/${id}`);
  redirect(`/console/opportunities/${id}`);
}

export async function submitClosure(form: FormData) {
  const id = text(form, "opportunityId");
  try {
    await closeOpportunity(
      {
        opportunityId: id,
        outcome: text(form, "outcome") as "won" | "lost" | "on_hold" | "withdrawn",
        reasonId: text(form, "reasonId") || undefined,
      },
      await actorId(),
    );
  } catch (error) {
    backWithViolations(id, error);
  }
  revalidatePath(`/console/opportunities/${id}`);
  redirect(`/console/opportunities/${id}`);
}

export async function submitNextAction(form: FormData) {
  const id = text(form, "opportunityId");
  const subject = text(form, "subject");
  const dueDate = text(form, "dueDate");
  if (subject && dueDate) {
    await setNextAction({ opportunityId: id, subject, dueDate }, await actorId());
    revalidatePath(`/console/opportunities/${id}`);
  }
  redirect(`/console/opportunities/${id}`);
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
