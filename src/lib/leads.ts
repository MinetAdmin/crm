import { db } from "./db";
import { writeAudit } from "./audit";
import { conversionConditions, type ConversionState, canConvert } from "./lead-rules";

export type LeadRow = {
  id: string;
  companyName: string;
  status: string;
  source: string;
  owner: string;
  unit: string;
  createdAt: Date;
};

export async function listLeads(status?: string): Promise<LeadRow[]> {
  const rows = await db().lead.findMany({
    where: {
      archived_at: null,
      ...(status ? { status: status as never } : {}),
    },
    orderBy: { created_at: "desc" },
    take: 200,
    include: {
      ref_value_lead_source_idToref_value: { select: { label: true } },
      app_user: { select: { full_name: true } },
      unit: { select: { code: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id.toString(),
    companyName: row.company_name,
    status: row.status,
    source: row.ref_value_lead_source_idToref_value.label,
    owner: row.app_user.full_name,
    unit: row.unit.code,
    createdAt: row.created_at,
  }));
}

export async function getLead(id: string) {
  return db().lead.findFirst({
    where: { id: BigInt(id), archived_at: null },
    include: {
      ref_value_lead_source_idToref_value: { select: { label: true } },
      app_user: { select: { full_name: true } },
      unit: { select: { id: true, code: true, name: true } },
      sector: { select: { id: true, code: true } },
      account: {
        select: {
          id: true,
          name: true,
          sector_id: true,
          contact: { where: { archived_at: null, is_decision_maker: true }, select: { id: true } },
        },
      },
      lead_product_interest: { include: { product: { select: { id: true, name: true } } } },
    },
  });
}

type LeadRecord = NonNullable<Awaited<ReturnType<typeof getLead>>>;

/** Maps a stored lead onto the state the conversion rules read. */
export function conversionStateOf(lead: LeadRecord): ConversionState {
  return {
    accountResolved: lead.matched_account_id !== null,
    decisionMakerNamed: (lead.account?.contact.length ?? 0) > 0,
    productCount: lead.lead_product_interest.length,
    estimatedValue: lead.estimated_value ? Number(lead.estimated_value) : null,
    ownerAccepted: true,
  };
}

export type NewLead = {
  companyName: string;
  matchedAccountId?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  sourceId: string;
  unitId: string;
  sectorId?: string;
  estimatedValue?: number;
  ownerId: string;
  productIds: string[];
};

export async function createLead(input: NewLead, actorId: bigint): Promise<bigint> {
  return db().$transaction(async (tx) => {
    const lead = await tx.lead.create({
      data: {
        company_name: input.companyName.trim(),
        matched_account_id: input.matchedAccountId ? BigInt(input.matchedAccountId) : null,
        contact_name: input.contactName?.trim() || null,
        contact_email: input.contactEmail?.trim().toLowerCase() || null,
        contact_phone: input.contactPhone?.trim() || null,
        source_id: BigInt(input.sourceId),
        unit_id: BigInt(input.unitId),
        sector_id: input.sectorId ? BigInt(input.sectorId) : null,
        estimated_value: input.estimatedValue ?? null,
        owner_id: BigInt(input.ownerId),
        lead_product_interest: {
          create: input.productIds.map((id) => ({ product_id: BigInt(id) })),
        },
      },
    });
    await writeAudit(tx, {
      entity: "lead",
      entityId: lead.id,
      changedBy: actorId,
      changes: [
        { field: "company_name", oldValue: null, newValue: lead.company_name },
        { field: "owner_id", oldValue: null, newValue: lead.owner_id.toString() },
        { field: "status", oldValue: null, newValue: lead.status },
      ],
    });
    return lead.id;
  });
}

export type Conversion = {
  leadId: string;
  name: string;
  sectorId: string;
  stageId: string;
  expectedCloseDate: string;
};

/**
 * Turns a qualified lead into an opportunity in one transaction: the
 * opportunity, its first stage history row, the link in both directions and
 * the closed lead, with audit entries for each.
 */
export async function convertLead(input: Conversion, actorId: bigint): Promise<bigint> {
  const lead = await getLead(input.leadId);
  if (!lead) throw new Error("Lead not found");
  if (lead.status === "converted") throw new Error("Lead is already converted");
  if (!canConvert(conversionStateOf(lead))) {
    const missing = conversionConditions(conversionStateOf(lead))
      .filter((c) => !c.met)
      .map((c) => c.label)
      .join("; ");
    throw new Error(`Lead is not ready to convert: ${missing}`);
  }

  const stage = await db().pipeline_stage.findUniqueOrThrow({
    where: { id: BigInt(input.stageId) },
  });

  return db().$transaction(async (tx) => {
    const opportunity = await tx.opportunity.create({
      data: {
        account_id: lead.matched_account_id as bigint,
        name: input.name.trim(),
        unit_id: lead.unit_id,
        sector_id: BigInt(input.sectorId),
        owner_id: lead.owner_id,
        stage_id: stage.id,
        probability: stage.default_probability,
        expected_close_date: new Date(input.expectedCloseDate),
        source_lead_id: lead.id,
        created_by: actorId,
      },
    });

    await tx.stage_history.create({
      data: {
        opportunity_id: opportunity.id,
        from_stage_id: null,
        to_stage_id: stage.id,
        changed_by: actorId,
      },
    });

    await tx.lead.update({
      where: { id: lead.id },
      data: { converted_opportunity_id: opportunity.id, status: "converted" },
    });

    await writeAudit(tx, {
      entity: "opportunity",
      entityId: opportunity.id,
      changedBy: actorId,
      changes: [
        { field: "name", oldValue: null, newValue: opportunity.name },
        { field: "stage_id", oldValue: null, newValue: stage.code },
        { field: "source_lead_id", oldValue: null, newValue: lead.id.toString() },
      ],
    });
    await writeAudit(tx, {
      entity: "lead",
      entityId: lead.id,
      changedBy: actorId,
      changes: [
        { field: "status", oldValue: lead.status, newValue: "converted" },
        {
          field: "converted_opportunity_id",
          oldValue: null,
          newValue: opportunity.id.toString(),
        },
      ],
    });

    return opportunity.id;
  });
}
