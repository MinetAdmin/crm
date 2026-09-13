"use server";

import { revalidatePath } from "next/cache";

import type { FormSheetState } from "@/components/console/FormSheet";
import { TargetRuleError, setTarget } from "@/lib/targets";
import { evenPhasing } from "@/lib/target-rules";
import { currentViewer } from "@/lib/viewer";
import { canWrite } from "@/lib/visibility";

function text(form: FormData, field: string): string {
  const value = form.get(field);
  return typeof value === "string" ? value.trim() : "";
}

export async function submitTarget(_state: FormSheetState, form: FormData): Promise<FormSheetState> {
  const viewer = await currentViewer();
  // Targets are leadership's to set (doc 06 §2).
  if (!canWrite(viewer, { ownerId: viewer.id, unitId: null })) {
    return { error: "Targets are set by BD leadership." };
  }

  const year = Number(text(form, "year")) || new Date().getFullYear();
  const amount = Number(text(form, "amount"));
  const level = text(form, "level") as "company" | "unit" | "owner" | "initiative";
  if (!Number.isFinite(amount) || amount <= 0) return { error: "An amount above zero is required." };

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
    if (error instanceof TargetRuleError) return { error: error.message };
    throw error;
  }
  revalidatePath("/console/targets");
  return { ok: true };
}
