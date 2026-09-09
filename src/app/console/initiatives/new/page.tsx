import { BackLink, Notice, PrimaryButton, SelectField, TextField } from "@/components/console/ui";
import { db } from "@/lib/db";
import { submitInitiative } from "../actions";

export default async function NewInitiativePage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ error?: string }> }>) {
  const { error } = await searchParams;
  const [units, sectors, users, statuses] = await Promise.all([
    db().unit.findMany({ where: { active: true }, orderBy: { code: "asc" } }),
    db().sector.findMany({ where: { active: true }, orderBy: { code: "asc" } }),
    db().app_user.findMany({ where: { active: true }, orderBy: { full_name: "asc" } }),
    db().ref_value.findMany({
      where: { active: true, ref_list: { code: "initiative_status" } },
      orderBy: { sort_order: "asc" },
    }),
  ]);

  return (
    <div className="w-full max-w-xl">
      <BackLink href="/console/initiatives">Initiatives</BackLink>
      <h1 className="mt-3 text-2xl font-semibold tracking-[-0.01em]">New initiative</h1>

      {error === "required" && (
        <div className="mt-4">
          <Notice>A name and an annual target above zero are required.</Notice>
        </div>
      )}

      <form action={submitInitiative} className="mt-6 grid gap-4">
        <TextField label="Name" name="name" required autoFocus />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Unit"
            name="unitId"
            emptyLabel="Choose a unit"
            options={units.map((u) => ({ value: u.id.toString(), label: u.name }))}
          />
          <SelectField
            label="Sector"
            name="sectorId"
            emptyLabel="Choose a sector"
            options={sectors.map((s) => ({ value: s.id.toString(), label: s.code }))}
          />
          <SelectField
            label="Champion"
            name="championId"
            emptyLabel="Choose a champion"
            options={users.map((u) => ({ value: u.id.toString(), label: u.full_name }))}
          />
          <SelectField
            label="Status"
            name="statusId"
            emptyLabel="Choose a status"
            options={statuses.map((s) => ({ value: s.id.toString(), label: s.label }))}
          />
          <TextField label="Annual target (UGX)" name="annualTarget" required />
          <TextField
            label="Target year"
            name="targetYear"
            defaultValue={String(new Date().getFullYear())}
          />
        </div>
        <div className="flex items-center gap-3">
          <PrimaryButton>Create initiative</PrimaryButton>
          <BackLink href="/console/initiatives">Cancel</BackLink>
        </div>
      </form>
    </div>
  );
}
