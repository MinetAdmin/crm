import { BackLink, Notice, PrimaryButton, SelectField, TextField } from "@/components/console/ui";
import { db } from "@/lib/db";
import { BASIS_LABEL } from "@/lib/tender-rules";
import { submitTender } from "../actions";

export default async function NewTenderPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ error?: string }> }>) {
  const { error } = await searchParams;
  const [units, sectors, prequals] = await Promise.all([
    db().unit.findMany({ where: { active: true }, orderBy: { code: "asc" } }),
    db().sector.findMany({ where: { active: true }, orderBy: { code: "asc" } }),
    db().tender.findMany({
      where: { archived_at: null, tender_type: "prequalification" },
      orderBy: { title: "asc" },
    }),
  ]);

  return (
    <div className="w-full max-w-xl">
      <BackLink href="/console/tenders">Tenders</BackLink>
      <h1 className="mt-3 text-2xl font-semibold tracking-[-0.01em]">New tender</h1>

      {error === "required" && (
        <div className="mt-4">
          <Notice>A title and a recorded value above zero are required.</Notice>
        </div>
      )}

      <form action={submitTender} className="mt-6 grid gap-4">
        <TextField label="Title or reference" name="title" required autoFocus />
        <TextField label="Issuing body" name="issuingBody" required />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Type"
            name="tenderType"
            emptyLabel="Tender"
            options={[
              { value: "tender", label: "Tender" },
              { value: "prequalification", label: "Prequalification" },
            ]}
          />
          <SelectField
            label="Parent prequalification"
            name="parentId"
            options={prequals.map((p) => ({ value: p.id.toString(), label: p.title }))}
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
            emptyLabel="Choose a sector"
            options={sectors.map((s) => ({ value: s.id.toString(), label: s.code }))}
          />
          <TextField label="Recorded value" name="recordedValue" required />
          <SelectField
            label="Value basis"
            name="valueBasis"
            emptyLabel="Choose a basis"
            options={Object.entries(BASIS_LABEL).map(([value, label]) => ({ value, label }))}
          />
        </div>
        <label className="block text-sm">
          <span className="font-medium">Submission deadline</span>
          <input
            type="date"
            name="submissionDeadline"
            className="mt-1 w-full rounded-md border border-(--c-line) bg-(--c-surface) px-3 py-2 text-sm"
          />
        </label>
        <div className="flex items-center gap-3">
          <PrimaryButton>Create tender</PrimaryButton>
          <BackLink href="/console/tenders">Cancel</BackLink>
        </div>
      </form>
    </div>
  );
}
