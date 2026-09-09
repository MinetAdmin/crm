import { db } from "@/lib/db";
import {
  BackLink,
  Notice,
  PrimaryButton,
  SelectField,
  TextField,
} from "@/components/console/ui";
import { submitAccount } from "../actions";

export default async function NewAccountPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{
    name?: string;
    sectorId?: string;
    unitId?: string;
    duplicates?: string;
    error?: string;
  }>;
}>) {
  const params = await searchParams;
  const [units, sectors, duplicates] = await Promise.all([
    db().unit.findMany({ where: { active: true }, orderBy: { code: "asc" } }),
    db().sector.findMany({ where: { active: true }, orderBy: { code: "asc" } }),
    params.duplicates
      ? db().account.findMany({
          where: { id: { in: params.duplicates.split(",").map(BigInt) } },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="w-full max-w-xl">
      <BackLink href="/console/accounts">Accounts</BackLink>
      <h1 className="mt-3 text-2xl font-semibold tracking-[-0.01em]">New account</h1>

      {params.error === "name" && (
        <div className="mt-4">
          <Notice>A name is required.</Notice>
        </div>
      )}

      {duplicates.length > 0 && (
        <div className="mt-4">
          <Notice tone="warn">
            <p className="font-medium">This may already exist.</p>
            <ul className="mt-2 grid gap-1">
              {duplicates.map((account) => (
                <li key={account.id.toString()}>
                  <a
                    href={`/console/accounts/${account.id}`}
                    className="underline underline-offset-2"
                  >
                    {account.name}
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-(--c-muted)">
              Use the existing record, or continue if this is a different client.
            </p>
          </Notice>
        </div>
      )}

      <form action={submitAccount} className="mt-6 grid gap-4">
        <TextField label="Name" name="name" defaultValue={params.name} required autoFocus />

        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Unit"
            name="unitId"
            defaultValue={params.unitId}
            options={units.map((unit) => ({ value: unit.id.toString(), label: unit.name }))}
          />
          <SelectField
            label="Sector"
            name="sectorId"
            defaultValue={params.sectorId}
            options={sectors.map((sector) => ({
              value: sector.id.toString(),
              label: sector.code,
            }))}
          />
        </div>

        {duplicates.length > 0 && <input type="hidden" name="confirmed" value="yes" />}

        <div className="flex items-center gap-3">
          <PrimaryButton>
            {duplicates.length > 0 ? "Create anyway" : "Create account"}
          </PrimaryButton>
          <BackLink href="/console/accounts">Cancel</BackLink>
        </div>
      </form>
    </div>
  );
}
