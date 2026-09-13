import Link from "next/link";
import { notFound } from "next/navigation";

import { FormSheet } from "@/components/console/FormSheet";
import { SelectField, TextField } from "@/components/console/fields";
import { BackLink, Notice } from "@/components/console/ui";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { formatAmount } from "@/lib/format";
import { canConvert, conversionConditions, hasContactMethod } from "@/lib/lead-rules";
import { conversionStateOf, getLead } from "@/lib/leads";
import { submitConversion } from "../actions";

export default async function LeadPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const lead = await getLead(id);
  if (!lead) notFound();

  const state = conversionStateOf(lead);
  const conditions = conversionConditions(state);
  const ready = canConvert(state);
  const [stages, sectors] = await Promise.all([
    db().pipeline_stage.findMany({ where: { active: true }, orderBy: { sort_order: "asc" }, take: 2 }),
    db().sector.findMany({ where: { active: true }, orderBy: { code: "asc" } }),
  ]);

  return (
    <div className="w-full max-w-4xl">
      <BackLink href="/console/leads">Leads</BackLink>
      <h1 className="mt-3 text-2xl font-semibold tracking-[-0.01em]">{lead.company_name}</h1>
      <p className="mt-1 text-sm text-(--c-muted)">
        {lead.status} · {lead.ref_value_lead_source_idToref_value.label} · {lead.app_user.full_name}{" "}
        · {lead.unit.code}
      </p>

      <dl className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-3">
        <Detail label="Account">
          {lead.account ? (
            <Link
              href={`/console/accounts/${lead.account.id}`}
              className="underline underline-offset-2"
            >
              {lead.account.name}
            </Link>
          ) : (
            "Not matched"
          )}
        </Detail>
        <Detail label="Estimated value">
          {lead.estimated_value ? formatAmount(Number(lead.estimated_value)) : "Unknown"}
        </Detail>
        <Detail label="Products">
          {lead.lead_product_interest.map((p) => p.product.name).join(", ") || "None recorded"}
        </Detail>
        <Detail label="Contact">{lead.contact_name ?? "None named"}</Detail>
        <Detail label="Email">{lead.contact_email ?? "—"}</Detail>
        <Detail label="Phone">{lead.contact_phone ?? "—"}</Detail>
      </dl>

      {!hasContactMethod({
        contactEmail: lead.contact_email,
        contactPhone: lead.contact_phone,
      }) && (
        <div className="mt-4">
          <Notice>
            No email or phone. A lead cannot be qualified without a way to reach someone.
          </Notice>
        </div>
      )}

      <section className="mt-8 rounded-md border border-(--c-line) bg-(--c-surface) p-5">
        <h2 className="text-[15px] font-semibold">Convert to an opportunity</h2>
        <p className="mt-1 text-sm text-(--c-muted)">
          All four must hold. Anything short of that stays a lead.
        </p>

        <ul className="mt-4 grid gap-2">
          {conditions.map((condition) => (
            <li key={condition.key} className="flex items-baseline gap-2.5 text-sm">
              <span
                aria-hidden
                className={`mt-1 size-2 shrink-0 rounded-full ${
                  condition.met ? "bg-(--c-good)" : "bg-(--c-warn)"
                }`}
              />
              <span>
                <span className={condition.met ? "" : "font-medium"}>{condition.label}</span>
                <span className="sr-only">{condition.met ? ": met" : ": not met"}</span>
                {!condition.met && (
                  <span className="block text-[13px] text-(--c-muted)">{condition.unmetHint}</span>
                )}
              </span>
            </li>
          ))}
        </ul>

        {lead.status === "converted" ? (
          <p className="mt-5 text-sm text-(--c-muted)">
            Already converted to opportunity {lead.converted_opportunity_id?.toString()}.
          </p>
        ) : (
          ready && (
            <div className="mt-5 border-t border-(--c-line-soft) pt-5">
              <FormSheet
                trigger={<Button size="sm">Convert to an opportunity</Button>}
                title="Convert to an opportunity"
                description="The lead is kept, so the funnel stays measurable."
                action={submitConversion}
                submitLabel="Convert"
              >
                <input type="hidden" name="leadId" value={lead.id.toString()} />
                <TextField
                  label="Opportunity name"
                  name="name"
                  defaultValue={`${lead.account?.name ?? lead.company_name}, ${
                    lead.lead_product_interest[0]?.product.name ?? "Pipeline"
                  } ${new Date().getFullYear()}`}
                  required
                />
                <SelectField
                  label="Stage"
                  name="stageId"
                  defaultValue={stages[0]?.id.toString()}
                  emptyLabel="Choose a stage"
                  options={stages.map((s) => ({ value: s.id.toString(), label: s.name }))}
                />
                <div className="grid grid-cols-2 gap-3">
                  <SelectField
                    label="Sector"
                    name="sectorId"
                    defaultValue={(lead.sector?.id ?? lead.account?.sector_id)?.toString()}
                    emptyLabel="Choose a sector"
                    options={sectors.map((s) => ({ value: s.id.toString(), label: s.code }))}
                  />
                  <TextField label="Expected close" name="expectedCloseDate" type="date" required />
                </div>
              </FormSheet>
            </div>
          )
        )}
      </section>
    </div>
  );
}

function Detail({ label, children }: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <div>
      <dt className="text-[13px] text-(--c-muted)">{label}</dt>
      <dd className="mt-0.5 text-sm">{children}</dd>
    </div>
  );
}
