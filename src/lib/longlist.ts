import { db } from "./db";
import { writeAudit } from "./audit";
import { createLeadIn, type NewLead } from "./leads";
import {
  coverageOf,
  progressOf,
  type Coverage,
  type LonglistStatus,
  type LonglistTrack,
  type Progress,
} from "./longlist-rules";

export const LONGLIST_CAP = 500;

export type LonglistEntryRow = {
  id: string;
  companyName: string;
  track: LonglistTrack;
  planYear: number | null;
  source: string | null;
  sector: string | null;
  unit: string | null;
  unitId: string | null;
  sectorId: string | null;
  notes: string | null;
  status: LonglistStatus;
  progress: Progress;
  leadId: string | null;
  opportunityId: string | null;
  addedAt: string;
};

export type LonglistFilters = {
  search?: string;
  track?: LonglistTrack;
  status?: LonglistStatus;
};

/** The register with each name's onward journey resolved at read time. */
export async function listLonglist(filters: LonglistFilters = {}): Promise<LonglistEntryRow[]> {
  const rows = await db().longlist_entry.findMany({
    where: {
      archived_at: null,
      ...(filters.search
        ? { company_name: { contains: filters.search, mode: "insensitive" as const } }
        : {}),
      ...(filters.track ? { track: filters.track } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    },
    orderBy: [{ status: "asc" }, { company_name: "asc" }],
    take: LONGLIST_CAP,
    include: {
      sector: { select: { code: true } },
      unit: { select: { code: true } },
      lead: { select: { id: true, status: true, converted_opportunity_id: true } },
    },
  });

  const opportunityIds = rows
    .map((row) => row.lead?.converted_opportunity_id)
    .filter((id): id is bigint => id !== null && id !== undefined);
  const opportunities = opportunityIds.length
    ? await db().opportunity.findMany({
        where: { id: { in: opportunityIds } },
        select: { id: true, outcome: true, pipeline_stage: { select: { name: true } } },
      })
    : [];
  const byOpportunity = new Map(
    opportunities.map((o) => [
      o.id.toString(),
      { outcome: o.outcome, stage: o.pipeline_stage.name },
    ]),
  );

  return rows.map((row) => {
    const promoted = row.lead
      ? {
          leadStatus: row.lead.status,
          opportunity: row.lead.converted_opportunity_id
            ? (byOpportunity.get(row.lead.converted_opportunity_id.toString()) ?? null)
            : null,
        }
      : null;
    return {
      id: row.id.toString(),
      companyName: row.company_name,
      track: row.track,
      planYear: row.plan_year,
      source: row.source,
      sector: row.sector?.code ?? null,
      unit: row.unit?.code ?? null,
      unitId: row.unit_id?.toString() ?? null,
      sectorId: row.sector_id?.toString() ?? null,
      notes: row.notes,
      status: row.status,
      progress: progressOf(row.status, row.drop_reason, promoted),
      leadId: row.lead?.id.toString() ?? null,
      opportunityId: row.lead?.converted_opportunity_id?.toString() ?? null,
      addedAt: row.created_at.toISOString().slice(0, 10),
    };
  });
}

/** The planned-book coverage for one budget year. */
export async function plannedCoverage(year: number): Promise<Coverage> {
  const rows = await listLonglist({ track: "planned" });
  return coverageOf(rows.filter((row) => row.planYear === year).map((row) => row.progress));
}

export type NewLonglistEntries = {
  names: string[];
  track: LonglistTrack;
  planYear?: number;
  source?: string;
  unitId?: string;
  sectorId?: string;
};

/** Bulk entry: one row per pasted name, audited individually. */
export async function createLonglistEntries(
  input: NewLonglistEntries,
  actorId: bigint,
): Promise<number> {
  const names = input.names.map((name) => name.trim()).filter(Boolean);
  if (names.length === 0) return 0;

  await db().$transaction(async (tx) => {
    for (const name of names) {
      const entry = await tx.longlist_entry.create({
        data: {
          company_name: name,
          track: input.track,
          plan_year: input.track === "planned" ? input.planYear : null,
          source: input.source?.trim() || null,
          unit_id: input.unitId ? BigInt(input.unitId) : null,
          sector_id: input.sectorId ? BigInt(input.sectorId) : null,
          created_by: actorId,
        },
      });
      await writeAudit(tx, {
        entity: "longlist_entry",
        entityId: entry.id,
        changedBy: actorId,
        changes: [
          { field: "company_name", oldValue: null, newValue: entry.company_name },
          { field: "track", oldValue: null, newValue: entry.track },
        ],
      });
    }
  });
  return names.length;
}

export type Promotion = { entryId: string; lead: NewLead };

/** One transaction: the new lead, the entry marked picked, both audited. */
export async function promoteLonglistEntry(input: Promotion, actorId: bigint): Promise<bigint> {
  return db().$transaction(async (tx) => {
    const leadId = await createLeadIn(tx, input.lead, actorId);
    const id = BigInt(input.entryId);
    const before = await tx.longlist_entry.findUniqueOrThrow({ where: { id } });
    await tx.longlist_entry.update({
      where: { id },
      data: { status: "picked", promoted_lead_id: leadId, updated_at: new Date() },
    });
    await writeAudit(tx, {
      entity: "longlist_entry",
      entityId: id,
      changedBy: actorId,
      changes: [
        { field: "status", oldValue: before.status, newValue: "picked" },
        { field: "promoted_lead_id", oldValue: null, newValue: leadId.toString() },
      ],
    });
    return leadId;
  });
}

/** Park, drop (with the reason BR-LL-03 requires) or restore an entry. */
export async function setLonglistStatus(
  input: { entryId: string; status: "unworked" | "parked" | "dropped"; dropReason?: string },
  actorId: bigint,
): Promise<void> {
  await db().$transaction(async (tx) => {
    const id = BigInt(input.entryId);
    const before = await tx.longlist_entry.findUniqueOrThrow({ where: { id } });
    await tx.longlist_entry.update({
      where: { id },
      data: {
        status: input.status,
        drop_reason: input.status === "dropped" ? (input.dropReason ?? null) : null,
        updated_at: new Date(),
      },
    });
    await writeAudit(tx, {
      entity: "longlist_entry",
      entityId: id,
      changedBy: actorId,
      changes: [{ field: "status", oldValue: before.status, newValue: input.status }],
    });
  });
}
