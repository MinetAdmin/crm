"use client";

import { Plus } from "lucide-react";

import { FormSheet } from "@/components/console/FormSheet";
import { SelectField, TextField } from "@/components/console/fields";
import { Notice, pillPrimaryClass } from "@/components/console/ui";
import { Button } from "@/components/ui/button";
import { submitAccount } from "./actions";

type Option = Readonly<{ value: string; label: string }>;

export function NewAccountSheet({
  units,
  sectors,
}: Readonly<{ units: ReadonlyArray<Option>; sectors: ReadonlyArray<Option> }>) {
  return (
    <FormSheet
      trigger={
        <Button size="sm" className={pillPrimaryClass}>
          <Plus className="size-3" aria-hidden />
          New account
        </Button>
      }
      title="New account"
      action={submitAccount}
      submitLabel={(state) => (state?.duplicates?.length ? "Create anyway" : "Create account")}
    >
      {(state) => (
        <>
          {state?.duplicates && state.duplicates.length > 0 && (
            <>
              <Notice tone="warn">
                <p className="font-medium">This may already exist.</p>
                <ul className="mt-2 grid gap-1">
                  {state.duplicates.map((account) => (
                    <li key={account.id}>
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
                  Use the existing record, or create anyway if this is a different client.
                </p>
              </Notice>
              <input type="hidden" name="confirmed" value="yes" />
            </>
          )}
          <TextField label="Name" name="name" required />
          <div className="grid grid-cols-2 gap-3">
            <SelectField label="Unit" name="unitId" options={units} />
            <SelectField label="Sector" name="sectorId" options={sectors} />
          </div>
        </>
      )}
    </FormSheet>
  );
}
