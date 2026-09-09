import { notFound } from "next/navigation";

import { Notice, PrimaryButton, SelectField, TextField } from "@/components/console/ui";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { currentViewer } from "@/lib/viewer";
import { canAdminister } from "@/lib/visibility";
import { submitRefValueActive, submitSetting, submitUser, submitUserActive } from "./actions";

const ROLES = ["bd_owner", "unit_head", "bd_leadership", "executive_ro", "admin"];

export default async function AdminPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ error?: string }> }>) {
  const viewer = await currentViewer();
  if (!canAdminister(viewer)) notFound();

  const [{ error }, users, units, settings, lists, audit] = await Promise.all([
    searchParams,
    db().app_user.findMany({ orderBy: [{ active: "desc" }, { full_name: "asc" }], include: { unit: true } }),
    db().unit.findMany({ where: { active: true }, orderBy: { code: "asc" } }),
    db().system_setting.findMany({ orderBy: { key: "asc" } }),
    db().ref_list.findMany({
      orderBy: { code: "asc" },
      include: { ref_value: { orderBy: { sort_order: "asc" } } },
    }),
    db().audit_log.findMany({
      orderBy: { changed_at: "desc" },
      take: 25,
      include: { app_user: { select: { full_name: true } } },
    }),
  ]);

  return (
    <div className="grid w-full max-w-4xl gap-8">
      {error && (
        <Notice>
          {error === "exists"
            ? "Someone already has that email."
            : "A name and an email are required."}
        </Notice>
      )}

      <section>
        <h2 className="text-[15px] font-semibold">People</h2>
        <p className="mt-1 text-[13px] text-(--c-muted)">
          Creating a record is the invitation. The person signs in with Microsoft and the identity
          links itself on first use. Deactivating keeps the record and its history.
        </p>
        <div className="mt-3 overflow-x-auto rounded-md border border-(--c-line) bg-(--c-surface)">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-(--c-line-soft) text-left text-[13px] text-(--c-muted)">
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Email</th>
                <th className="px-4 py-2.5 font-medium">Role</th>
                <th className="px-4 py-2.5 font-medium">Unit</th>
                <th className="px-4 py-2.5 font-medium">Signed in</th>
                <th className="px-4 py-2.5 text-right font-medium">Active</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id.toString()} className="border-b border-(--c-line-soft) last:border-b-0">
                  <td className="px-4 py-2.5 font-medium">{u.full_name}</td>
                  <td className="px-4 py-2.5 text-(--c-muted)">{u.email}</td>
                  <td className="px-4 py-2.5 text-(--c-muted)">{u.role.replaceAll("_", " ")}</td>
                  <td className="px-4 py-2.5 text-(--c-muted)">{u.unit?.code ?? "—"}</td>
                  <td className="px-4 py-2.5 text-(--c-muted)">
                    {u.last_login_at ? u.last_login_at.toISOString().slice(0, 10) : "Never"}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <form action={submitUserActive}>
                      <input type="hidden" name="userId" value={u.id.toString()} />
                      <Button type="submit" variant="outline" size="xs">
                        {u.active ? "Deactivate" : "Reactivate"}
                      </Button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form action={submitUser} className="mt-3 grid gap-3 rounded-md border border-(--c-line) bg-(--c-surface) p-4 sm:grid-cols-4 sm:items-end">
          <TextField label="Full name" name="fullName" required />
          <TextField label="Work email" name="email" type="email" required />
          <SelectField
            label="Role"
            name="role"
            emptyLabel="BD owner"
            options={ROLES.map((r) => ({ value: r, label: r.replaceAll("_", " ") }))}
          />
          <SelectField
            label="Unit"
            name="unitId"
            options={units.map((u) => ({ value: u.id.toString(), label: u.code }))}
          />
          <div className="sm:col-span-4">
            <PrimaryButton>Invite</PrimaryButton>
          </div>
        </form>
      </section>

      <section>
        <h2 className="text-[15px] font-semibold">Settings</h2>
        <ul className="mt-3 grid gap-px overflow-hidden rounded-md border border-(--c-line) bg-(--c-surface)">
          {settings.map((s) => (
            <li key={s.key} className="border-b border-(--c-line-soft) px-4 py-2.5 last:border-b-0">
              <form action={submitSetting} className="flex flex-wrap items-center gap-3">
                <input type="hidden" name="key" value={s.key} />
                <span className="min-w-64 flex-1 text-sm">{s.key.replaceAll("_", " ")}</span>
                <input
                  name="value"
                  defaultValue={s.value}
                  className="w-28 rounded-md border border-(--c-line) bg-(--c-surface) px-2 py-1 text-sm tabular-nums"
                />
                <Button type="submit" variant="outline" size="xs">
                  Save
                </Button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-[15px] font-semibold">Managed lists</h2>
        <p className="mt-1 text-[13px] text-(--c-muted)">
          A value in use is deactivated, never deleted, so the records that point at it keep their
          meaning.
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {lists.map((list) => (
            <div key={list.code} className="rounded-md border border-(--c-line) bg-(--c-surface) p-4">
              <h3 className="text-sm font-medium">{list.code.replaceAll("_", " ")}</h3>
              <ul className="mt-2 grid gap-1">
                {list.ref_value.map((value) => (
                  <li key={value.id.toString()} className="flex items-center justify-between gap-3 text-[13px]">
                    <span className={value.active ? "" : "text-(--c-muted) line-through"}>
                      {value.label}
                    </span>
                    <form action={submitRefValueActive}>
                      <input type="hidden" name="refValueId" value={value.id.toString()} />
                      <Button
                        type="submit"
                        variant="link"
                        size="xs"
                        className="h-auto p-0 text-muted-foreground"
                      >
                        {value.active ? "Deactivate" : "Restore"}
                      </Button>
                    </form>
                  </li>
                ))}
                {list.ref_value.length === 0 && (
                  <li className="text-[13px] text-(--c-muted)">Empty, pending the workshop.</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-[15px] font-semibold">Audit trail</h2>
        <div className="mt-3 overflow-x-auto rounded-md border border-(--c-line) bg-(--c-surface)">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-(--c-line-soft) text-left text-[13px] text-(--c-muted)">
                <th className="px-4 py-2 font-medium">When</th>
                <th className="px-4 py-2 font-medium">Entity</th>
                <th className="px-4 py-2 font-medium">Field</th>
                <th className="px-4 py-2 font-medium">From</th>
                <th className="px-4 py-2 font-medium">To</th>
                <th className="px-4 py-2 font-medium">By</th>
              </tr>
            </thead>
            <tbody>
              {audit.map((row) => (
                <tr key={row.id.toString()} className="border-b border-(--c-line-soft) last:border-b-0">
                  <td className="px-4 py-2 tabular-nums text-(--c-muted)">
                    {row.changed_at.toISOString().slice(0, 16).replace("T", " ")}
                  </td>
                  <td className="px-4 py-2 text-(--c-muted)">
                    {row.entity} {row.entity_id.toString()}
                  </td>
                  <td className="px-4 py-2">{row.field}</td>
                  <td className="px-4 py-2 text-(--c-muted)">{row.old_value ?? "—"}</td>
                  <td className="px-4 py-2">{row.new_value ?? "—"}</td>
                  <td className="px-4 py-2 text-(--c-muted)">{row.app_user.full_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
