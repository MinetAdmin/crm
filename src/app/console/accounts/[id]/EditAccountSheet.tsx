"use client";

import { Pencil } from "lucide-react";

import { FormSheet } from "@/components/console/FormSheet";
import { FormSection, SelectField, TextField } from "@/components/console/fields";
import { pillClass } from "@/components/console/ui";
import { Button } from "@/components/ui/button";

import { submitAccountEdit } from "../actions";

type Option = Readonly<{ value: string; label: string }>;

export function EditAccountSheet({
  account,
  units,
  sectors,
}: Readonly<{
  account: { id: string; name: string; unitId?: string; sectorId?: string };
  units: ReadonlyArray<Option>;
  sectors: ReadonlyArray<Option>;
}>) {
  return (
    <FormSheet
      trigger={
        <Button size="sm" variant="secondary" className={pillClass}>
          <Pencil className="size-3" aria-hidden />
          Edit
        </Button>
      }
      title="Edit account"
      description={`Update the name and classification of ${account.name}.`}
      action={submitAccountEdit}
      submitLabel="Save changes"
    >
      <input type="hidden" name="accountId" value={account.id} />
      <FormSection title="Account">
        <TextField label="Name" name="name" defaultValue={account.name} required />
      </FormSection>
      <FormSection title="Classification">
        <div className="grid grid-cols-2 gap-3">
          <SelectField label="Unit" name="unitId" defaultValue={account.unitId} options={units} />
          <SelectField
            label="Sector"
            name="sectorId"
            defaultValue={account.sectorId}
            options={sectors}
          />
        </div>
      </FormSection>
    </FormSheet>
  );
}
