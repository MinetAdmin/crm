"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/viewer";
import { takeSnapshot } from "@/lib/snapshots";

export async function submitSnapshot(form: FormData) {
  const viewer = await requireAdmin();
  const month = String(form.get("month") ?? "").trim();
  if (!month) redirect("/console/reports/movement");
  try {
    await takeSnapshot(month, BigInt(viewer.id));
  } catch {
    redirect("/console/reports/movement?error=exists");
  }
  revalidatePath("/console/reports/movement");
  redirect("/console/reports/movement");
}
