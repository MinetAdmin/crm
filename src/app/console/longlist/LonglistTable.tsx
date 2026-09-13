"use client";

import * as React from "react";

import Link from "next/link";

import { FormSheet } from "@/components/console/FormSheet";
import { SelectField, TextField, TextareaField } from "@/components/console/fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { LonglistEntryRow } from "@/lib/longlist";
import { TRACK_LABEL, progressLabel } from "@/lib/longlist-rules";
import { submitDrop, submitPark, submitPromote, submitRestore } from "./actions";

type Option = Readonly<{ value: string; label: string }>;
type Options = Readonly<{
  sources: ReadonlyArray<Option>;
  owners: ReadonlyArray<Option>;
  units: ReadonlyArray<Option>;
  sectors: ReadonlyArray<Option>;
}>;

export function LonglistTable({
  entries,
  options,
}: Readonly<{ entries: ReadonlyArray<LonglistEntryRow>; options: Options }>) {
  const [promoting, setPromoting] = React.useState<LonglistEntryRow | null>(null);
  const [dropping, setDropping] = React.useState<LonglistEntryRow | null>(null);

  return (
    <div className="overflow-x-auto rounded-md border border-(--c-line) bg-(--c-surface)">
      <Table className="[&_td]:border-l [&_td]:border-(--c-line-soft) [&_td:first-child]:border-l-0 [&_th]:border-l [&_th]:border-(--c-line-soft) [&_th:first-child]:border-l-0">
        <TableHeader>
          <TableRow>
            <TableHead>Company</TableHead>
            <TableHead>Track</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Sector</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Added</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="font-medium">{entry.companyName}</TableCell>
              <TableCell>
                <Badge variant="outline">
                  {TRACK_LABEL[entry.track]}
                  {entry.planYear ? ` ${entry.planYear}` : ""}
                </Badge>
              </TableCell>
              <TableCell className="text-(--c-muted)">{entry.source ?? "Unknown"}</TableCell>
              <TableCell className="text-(--c-muted)">{entry.unit ?? "Not set"}</TableCell>
              <TableCell className="text-(--c-muted)">{entry.sector ?? "Not set"}</TableCell>
              <TableCell>
                <ProgressCell entry={entry} />
              </TableCell>
              <TableCell className="tabular-nums text-(--c-muted)">{entry.addedAt}</TableCell>
              <TableCell className="text-right">
                <RowActions
                  entry={entry}
                  onPromote={() => setPromoting(entry)}
                  onDrop={() => setDropping(entry)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <FormSheet
        open={promoting !== null}
        onOpenChange={(open) => {
          if (!open) setPromoting(null);
        }}
        title={promoting ? `Promote ${promoting.companyName}` : "Promote"}
        description="Creates the lead and marks this name picked. The register keeps the link."
        action={submitPromote}
        submitLabel="Create lead"
      >
        {promoting && (
          <>
            <input type="hidden" name="entryId" value={promoting.id} />
            <SelectField
              label="Source"
              name="sourceId"
              emptyLabel="Choose a source"
              options={options.sources}
            />
            <SelectField
              label="Owner"
              name="ownerId"
              emptyLabel="Choose an owner"
              options={options.owners}
            />
            <div className="grid grid-cols-2 gap-3">
              <SelectField
                label="Unit"
                name="unitId"
                defaultValue={promoting.unitId ?? undefined}
                emptyLabel="Choose a unit"
                options={options.units}
              />
              <SelectField
                label="Sector"
                name="sectorId"
                defaultValue={promoting.sectorId ?? undefined}
                options={options.sectors}
              />
            </div>
            <TextField label="Estimated value (UGX)" name="estimatedValue" inputMode="numeric" />
          </>
        )}
      </FormSheet>

      <FormSheet
        open={dropping !== null}
        onOpenChange={(open) => {
          if (!open) setDropping(null);
        }}
        title={dropping ? `Drop ${dropping.companyName}` : "Drop"}
        description="Dropped names stay on the register with the reason, so the list stays honest."
        action={submitDrop}
        submitLabel="Drop"
      >
        {dropping && (
          <>
            <input type="hidden" name="entryId" value={dropping.id} />
            <TextareaField label="Why it is out" name="reason" rows={3} required />
          </>
        )}
      </FormSheet>
    </div>
  );
}

function ProgressCell({ entry }: Readonly<{ entry: LonglistEntryRow }>) {
  const label = progressLabel(entry.progress);
  const href = progressHref(entry);
  const muted = entry.progress.kind === "unworked" || entry.progress.kind === "parked";
  if (!href) {
    return (
      <span className={muted ? "text-(--c-muted)" : undefined} title={dropTitle(entry)}>
        {label}
      </span>
    );
  }
  return (
    <Link href={href} className="underline-offset-2 hover:underline">
      {label}
    </Link>
  );
}

function progressHref(entry: LonglistEntryRow): string | null {
  if (entry.progress.kind === "pipeline" || entry.progress.kind === "closed") {
    return entry.opportunityId ? `/console/opportunities/${entry.opportunityId}` : null;
  }
  if (entry.progress.kind === "lead") {
    return entry.leadId ? `/console/leads/${entry.leadId}` : null;
  }
  return null;
}

function dropTitle(entry: LonglistEntryRow): string | undefined {
  return entry.progress.kind === "dropped" && entry.progress.reason
    ? entry.progress.reason
    : undefined;
}

function RowActions({
  entry,
  onPromote,
  onDrop,
}: Readonly<{ entry: LonglistEntryRow; onPromote: () => void; onDrop: () => void }>) {
  if (entry.status === "picked") return null;
  return (
    <span className="inline-flex items-center gap-1">
      {entry.status !== "dropped" && (
        <Button variant="outline" size="xs" onClick={onPromote}>
          Promote
        </Button>
      )}
      {entry.status === "unworked" && (
        <StatusButton action={submitPark} entryId={entry.id} label="Park" />
      )}
      {(entry.status === "parked" || entry.status === "dropped") && (
        <StatusButton action={submitRestore} entryId={entry.id} label="Restore" />
      )}
      {entry.status !== "dropped" && (
        <Button variant="ghost" size="xs" onClick={onDrop}>
          Drop
        </Button>
      )}
    </span>
  );
}

function StatusButton({
  action,
  entryId,
  label,
}: Readonly<{ action: (form: FormData) => Promise<void>; entryId: string; label: string }>) {
  return (
    <form action={action} className="inline">
      <input type="hidden" name="entryId" value={entryId} />
      <Button type="submit" variant="ghost" size="xs">
        {label}
      </Button>
    </form>
  );
}
