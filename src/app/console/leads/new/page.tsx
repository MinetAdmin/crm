import { BackLink, Notice, PrimaryButton, SelectField, TextField } from "@/components/console/ui";
import { db } from "@/lib/db";
import { submitLead } from "../actions";

export default async function NewLeadPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ error?: string }> }>) {
  const { error } = await searchParams;
  const [units, sectors, owners, sources, products, accounts] = await Promise.all([
    db().unit.findMany({ where: { active: true }, orderBy: { code: "asc" } }),
    db().sector.findMany({ where: { active: true }, orderBy: { code: "asc" } }),
    db().app_user.findMany({ where: { active: true }, orderBy: { full_name: "asc" } }),
    db().ref_value.findMany({
      where: { active: true, ref_list: { code: "lead_source" } },
      orderBy: { sort_order: "asc" },
    }),
    db().product.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    db().account.findMany({ where: { archived_at: null }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="w-full max-w-2xl">
      <BackLink href="/console/leads">Leads</BackLink>
      <h1 className="mt-3 text-2xl font-semibold tracking-[-0.01em]">New lead</h1>

      {error === "required" && (
        <div className="mt-4">
          <Notice>Company, source, unit and owner are all required.</Notice>
        </div>
      )}

      <form action={submitLead} className="mt-6 grid gap-4">
        <TextField label="Company" name="companyName" required autoFocus />

        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Source"
            name="sourceId"
            emptyLabel="Choose a source"
            options={sources.map((s) => ({ value: s.id.toString(), label: s.label }))}
          />
          <SelectField
            label="Owner"
            name="ownerId"
            emptyLabel="Choose an owner"
            options={owners.map((o) => ({ value: o.id.toString(), label: o.full_name }))}
          />
          <SelectField
            label="Unit"
            name="unitId"
            emptyLabel="Choose a unit"
            options={units.map((u) => ({ value: u.id.toString(), label: u.name }))}
          />
          <SelectField
            label="Sector"
            name="sectorId"
            options={sectors.map((s) => ({ value: s.id.toString(), label: s.code }))}
          />
        </div>

        <SelectField
          label="Existing account"
          name="matchedAccountId"
          emptyLabel="Not matched yet"
          options={accounts.map((a) => ({ value: a.id.toString(), label: a.name }))}
        />

        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium">Products of interest</legend>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {products.map((product) => (
              <label key={product.id.toString()} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="productIds"
                  value={product.id.toString()}
                  className="size-4"
                />
                {product.name}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-3">
          <TextField label="Contact name" name="contactName" />
          <TextField label="Email" name="contactEmail" type="email" />
          <TextField label="Phone" name="contactPhone" />
        </div>

        <TextField label="Estimated value (UGX)" name="estimatedValue" />

        <div className="flex items-center gap-3">
          <PrimaryButton>Create lead</PrimaryButton>
          <BackLink href="/console/leads">Cancel</BackLink>
        </div>
      </form>
    </div>
  );
}
