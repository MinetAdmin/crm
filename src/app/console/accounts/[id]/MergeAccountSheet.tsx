"use client";

import { Merge } from "lucide-react";

import { FormSheet } from "@/components/console/FormSheet";
import { CheckboxField, FormSection, SelectField } from "@/components/console/fields";
import { Notice, pillClass } from "@/components/console/ui";
import { Button } from "@/components/ui/button";

import { submitAccountMerge } from "../actions";

type Option = Readonly<{ value: string; label: string }>;

export function MergeAccountSheet({
  account,
  survivors,
}: Readonly<{
  account: { id: string; name: string };
  survivors: ReadonlyArray<Option>;
}>) {
  return (
    <FormSheet
      trigger={
        <Button size="sm" variant="secondary" className={pillClass}>
          <Merge className="size-3" aria-hidden />
          Merge
        </Button>
      }
      title="Merge account"
      description={`Move everything on ${account.name} to a surviving account (FR-ACC-04).`}
      action={submitAccountMerge}
      submitLabel="Merge and archive"
    >
      <input type="hidden" name="accountId" value={account.id} />
      <Notice tone="warn">
        <p>
          Contacts, leads, pursuits, longlist matches, and activities move to the survivor.{" "}
          <span className="font-medium">{account.name}</span> is then archived. The merge is
          recorded in the audit log.
        </p>
      </Notice>
      <FormSection title="Survivor">
        <SelectField
          label="Surviving account"
          name="survivorId"
          options={survivors}
          emptyLabel="Pick an account"
        />
        <CheckboxField label={`Archive ${account.name} after the merge`} name="confirmed" />
      </FormSection>
    </FormSheet>
  );
}
