"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { TargetRuleError, setTarget } from "@/lib/targets";
import { evenPhasing } from "@/lib/target-rules";
import { currentViewer } from "@/lib/viewer";
import { canWrite } from "@/lib/visibility";

function text(form: FormData, field: string): string {
  const value = form.get(field);
  return typeof value === "string" ? value.trim() : "";
}

export async function submitTarget(form: FormData) {
  const viewer = await currentViewer();
  // Targets are leadership's to set (doc 06 §2).
  if (!canWrite(viewer, { ownerId: viewer.id, unitId: null })) {
    redirect("/console/targets?error=forbidden");
  }

  const year = Number(text(form, "year")) || new Date().getFullYear();
  const amount = Number(text(form, "amount"));
  const level = text(form, "level") as "company" | "unit" | "owner" | "initiative";
  if (!Number.isFinite(amount) || amount <= 0) redirect("/console/targets?error=amount");

  try {
    await setTarget(
      {
        year,
        level,
        unitId: text(form, "unitId") || undefined,
        ownerId: text(form, "ownerId") || undefined,
        initiativeId: text(form, "initiativeId") || undefined,
        amount,
        months: text(form, "phase") === "even" ? evenPhasing(amount) : undefined,
      },
      BigInt(viewer.id),
    );
  } catch (error) {
    if (error instanceof TargetRuleError) {
      redirect(`/console/targets?error=${encodeURIComponent(error.message)}`);
    }
    throw error;
  }
  revalidatePath("/console/targets");
  redirect("/console/targets");
}
