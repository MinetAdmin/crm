"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import type { FormSheetState } from "@/components/console/FormSheet";
import { writeAudit } from "@/lib/audit";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/viewer";

function text(form: FormData, field: string): string {
  const value = form.get(field);
  return typeof value === "string" ? value.trim() : "";
}

/** Invites a person by creating their record; Entra links the identity later. */
export async function submitUser(_state: FormSheetState, form: FormData): Promise<FormSheetState> {
  const viewer = await requireAdmin();
  const email = text(form, "email").toLowerCase();
  const fullName = text(form, "fullName");
  if (!email || !fullName) return { error: "A name and an email are required." };

  const existing = await db().app_user.findUnique({ where: { email } });
  if (existing) return { error: "Someone already has that email." };

  await db().$transaction(async (tx) => {
    const user = await tx.app_user.create({
      data: {
        email,
        full_name: fullName,
        role: (text(form, "role") || "bd_owner") as never,
        unit_id: text(form, "unitId") ? BigInt(text(form, "unitId")) : null,
      },
    });
    await writeAudit(tx, {
      entity: "app_user",
      entityId: user.id,
      changedBy: BigInt(viewer.id),
      changes: [
        { field: "email", oldValue: null, newValue: email },
        { field: "role", oldValue: null, newValue: user.role },
      ],
    });
  });
  revalidatePath("/console/admin");
  return { ok: true };
}

/** Deactivation keeps the record and its history; nothing is deleted. */
export async function submitUserActive(form: FormData) {
  const viewer = await requireAdmin();
  const id = BigInt(text(form, "userId"));
  const user = await db().app_user.findUniqueOrThrow({ where: { id } });

  await db().$transaction(async (tx) => {
    await tx.app_user.update({ where: { id }, data: { active: !user.active } });
    await writeAudit(tx, {
      entity: "app_user",
      entityId: id,
      changedBy: BigInt(viewer.id),
      changes: [
        { field: "active", oldValue: String(user.active), newValue: String(!user.active) },
      ],
    });
  });
  revalidatePath("/console/admin");
  redirect("/console/admin");
}

export async function submitSetting(form: FormData) {
  const viewer = await requireAdmin();
  const key = text(form, "key");
  const value = text(form, "value");
  if (!key) redirect("/console/admin");

  const existing = await db().system_setting.findUnique({ where: { key } });
  await db().$transaction(async (tx) => {
    await tx.system_setting.upsert({ where: { key }, update: { value }, create: { key, value } });
    await writeAudit(tx, {
      entity: "system_setting",
      entityId: 0,
      changedBy: BigInt(viewer.id),
      changes: [{ field: key, oldValue: existing?.value ?? null, newValue: value }],
    });
  });
  revalidatePath("/console/admin");
  redirect("/console/admin");
}

/** List values are deactivated, never deleted, since records point at them. */
export async function submitRefValueActive(form: FormData) {
  const viewer = await requireAdmin();
  const id = BigInt(text(form, "refValueId"));
  const value = await db().ref_value.findUniqueOrThrow({ where: { id } });

  await db().$transaction(async (tx) => {
    await tx.ref_value.update({ where: { id }, data: { active: !value.active } });
    await writeAudit(tx, {
      entity: "ref_value",
      entityId: id,
      changedBy: BigInt(viewer.id),
      changes: [{ field: "active", oldValue: String(value.active), newValue: String(!value.active) }],
    });
  });
  revalidatePath("/console/admin");
  redirect("/console/admin");
}
