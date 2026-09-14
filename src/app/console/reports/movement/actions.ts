"use server";

import { revalidatePath } from "next/cache";

import type { FormSheetState } from "@/components/console/FormSheet";
import { requireAdmin } from "@/lib/viewer";
import { takeSnapshot } from "@/lib/snapshots";

export async function submitSnapshot(_state: FormSheetState, form: FormData): Promise<FormSheetState> {
  const viewer = await requireAdmin();
  const month = String(form.get("month") ?? "").trim();
  if (!month) return { error: "A month is required." };
  try {
    await takeSnapshot(month, BigInt(viewer.id));
  } catch {
    return { error: "That month already has a snapshot. Snapshots are immutable." };
  }
  revalidatePath("/console/reports/movement");
  return { ok: true };
}
