"use client";

import * as React from "react";

import { CirclePause, CircleX, RotateCcw, UserRoundPlus } from "lucide-react";
import Link from "next/link";

import { FormSheet } from "@/components/console/FormSheet";
import { FormSection } from "@/components/console/fields";
import { SelectField, TextField, TextareaField } from "@/components/console/fields";
import { TagPill, tagToneFor } from "@/components/console/ui";
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
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-auto border-y border-border">
      <Table className="text-sm leading-none [&_td]:h-[42px] [&_td]:px-3 [&_td]:py-0 [&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:h-[38px] [&_th]:border-b [&_th]:border-border [&_th]:bg-background [&_th]:px-3 [&_th]:text-xs [&_th]:font-normal [&_th]:whitespace-nowrap [&_th]:text-(--subtle)">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
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
            <TableRow
              key={entry.id}
              className="transition-colors duration-150 ease-(--ease-out-strong) hover:bg-card/60"
            >
              <TableCell className="font-medium">{entry.companyName}</TableCell>
              <TableCell>
                <TagPill tone={entry.track === "planned" ? "blue" : "neutral"}>
                  {TRACK_LABEL[entry.track]}
                  {entry.planYear ? ` ${entry.planYear}` : ""}
                </TagPill>
              </TableCell>
              <TableCell className="text-(--c-muted)">{entry.source ?? "Unknown"}</TableCell>
              <TableCell>
                {entry.unit ? <TagPill>{entry.unit}</TagPill> : <span className="text-(--c-muted)">Not set</span>}
              </TableCell>
              <TableCell>
                {entry.sector ? (
                  <TagPill tone={tagToneFor(entry.sector)}>{entry.sector}</TagPill>
                ) : (
                  <span className="text-(--c-muted)">Not set</span>
                )}
              </TableCell>
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
      </div>

      <div className="grid shrink-0 grid-cols-2 gap-px border-b border-border bg-background p-px text-xs sm:grid-cols-4">
        <SummaryCell value={entries.length} label="names in view" />
        <SummaryCell value={countByStatus(entries, "unworked")} label="unworked" />
        <SummaryCell value={countByStatus(entries, "picked")} label="picked" />
        <SummaryCell
          value={countByStatus(entries, "parked") + countByStatus(entries, "dropped")}
          label="parked or dropped"
        />
      </div>

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
            <FormSection title="Routing">
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
            </FormSection>
            <FormSection title="Value">
              <TextField label="Estimated value (UGX)" name="estimatedValue" inputMode="numeric" />
            </FormSection>
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

const ICON_ACTION_CLASS =
  "inline-flex size-6 cursor-pointer items-center justify-center rounded-full text-(--soft) transition-colors duration-150 ease-(--ease-out-strong) hover:bg-foreground/6 hover:text-foreground";

function RowActions({
  entry,
  onPromote,
  onDrop,
}: Readonly<{ entry: LonglistEntryRow; onPromote: () => void; onDrop: () => void }>) {
  if (entry.status === "picked") return null;
  return (
    <span className="inline-flex items-center gap-0.5">
      {entry.status !== "dropped" && (
        <button
          type="button"
          onClick={onPromote}
          title="Promote to lead"
          aria-label={`Promote ${entry.companyName} to a lead`}
          className={ICON_ACTION_CLASS}
        >
          <UserRoundPlus className="size-3.5" aria-hidden />
        </button>
      )}
      {entry.status === "unworked" && (
        <StatusButton action={submitPark} entryId={entry.id} label={`Park ${entry.companyName}`}>
          <CirclePause className="size-3.5" aria-hidden />
        </StatusButton>
      )}
      {(entry.status === "parked" || entry.status === "dropped") && (
        <StatusButton
          action={submitRestore}
          entryId={entry.id}
          label={`Restore ${entry.companyName}`}
        >
          <RotateCcw className="size-3.5" aria-hidden />
        </StatusButton>
      )}
      {entry.status !== "dropped" && (
        <button
          type="button"
          onClick={onDrop}
          title="Drop with a reason"
          aria-label={`Drop ${entry.companyName}`}
          className={ICON_ACTION_CLASS}
        >
          <CircleX className="size-3.5" aria-hidden />
        </button>
      )}
    </span>
  );
}

function StatusButton({
  action,
  entryId,
  label,
  children,
}: Readonly<{
  action: (form: FormData) => Promise<void>;
  entryId: string;
  label: string;
  children: React.ReactNode;
}>) {
  return (
    <form action={action} className="inline">
      <input type="hidden" name="entryId" value={entryId} />
      <button
        type="submit"
        title={label.split(" ")[0]}
        aria-label={label}
        className={ICON_ACTION_CLASS}
      >
        {children}
      </button>
    </form>
  );
}

function countByStatus(
  entries: ReadonlyArray<LonglistEntryRow>,
  status: LonglistEntryRow["status"],
): number {
  return entries.filter((entry) => entry.status === status).length;
}

function SummaryCell({ value, label }: Readonly<{ value: number; label: string }>) {
  return (
    <div className="flex items-center gap-2 p-3 outline-1 outline-border">
      <span className="text-foreground tabular-nums">{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}
