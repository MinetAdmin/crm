import Link from "next/link";
import { notFound } from "next/navigation";

import { FormSheet } from "@/components/console/FormSheet";
import { SelectField } from "@/components/console/fields";
import { BackLink } from "@/components/console/ui";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { formatAmount } from "@/lib/format";
import { BASIS_LABEL, daysUntil, type ValueBasis } from "@/lib/tender-rules";
import { getTender } from "@/lib/tenders";
import { submitTenderStatus } from "../actions";

const STATUSES = [
  "to_submit",
  "submitted",
  "in_evaluation",
  "prequalified",
  "won",
  "lost",
  "withdrawn",
];

export default async function TenderPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const tender = await getTender(id);
  if (!tender) notFound();

  const reasons = await db().ref_value.findMany({
    where: { active: true, ref_list: { code: "tender_outcome_reason" } },
    orderBy: { sort_order: "asc" },
  });
  const days = tender.submission_deadline ? daysUntil(tender.submission_deadline, new Date()) : null;

  return (
    <div className="w-full max-w-3xl">
      <BackLink href="/console/tenders">Tenders</BackLink>
      <h1 className="mt-3 text-2xl font-semibold tracking-[-0.01em]">{tender.title}</h1>
      <p className="mt-1 text-sm text-(--c-muted)">
        {tender.issuing_body} · {tender.tender_type === "prequalification" ? "Prequalification" : "Tender"} ·{" "}
        {tender.unit.code} · {tender.sector.code} · {tender.status.replaceAll("_", " ")}
      </p>

      <dl className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-(--c-line) bg-(--c-surface) p-4">
          <dt className="text-[13px] text-(--c-muted)">
            Recorded value · {BASIS_LABEL[tender.value_basis as ValueBasis]}
          </dt>
          <dd className="mt-1 text-lg font-semibold tabular-nums">
            {formatAmount(Number(tender.recorded_value))}
          </dd>
          <p className="mt-1 text-[12px] text-(--c-muted)">
            Only comparable with values on the same basis.
          </p>
        </div>
        <div className="rounded-md border border-(--c-line) bg-(--c-surface) p-4">
          <dt className="text-[13px] text-(--c-muted)">Submission deadline</dt>
          <dd
            className={`mt-1 text-lg font-semibold tabular-nums ${
              days !== null && days >= 0 && days <= 14 ? "text-(--c-warn)" : ""
            }`}
          >
            {tender.submission_deadline
              ? `${tender.submission_deadline.toISOString().slice(0, 10)}`
              : "Not set"}
          </dd>
          {days !== null && (
            <p className="mt-1 text-[12px] text-(--c-muted)">
              {days >= 0 ? `${days} days remaining` : `${Math.abs(days)} days past`}
            </p>
          )}
        </div>
        <div className="rounded-md border border-(--c-line) bg-(--c-surface) p-4">
          <dt className="text-[13px] text-(--c-muted)">Chain</dt>
          <dd className="mt-1 text-sm">
            {tender.tender ? (
              <Link href={`/console/tenders/${tender.tender.id}`} className="underline underline-offset-2">
                From {tender.tender.title}
              </Link>
            ) : (
              "No parent prequalification"
            )}
          </dd>
          {tender.other_tender.length > 0 && (
            <ul className="mt-1 text-[13px] text-(--c-muted)">
              {tender.other_tender.map((child) => (
                <li key={child.id.toString()}>
                  <Link href={`/console/tenders/${child.id}`} className="underline underline-offset-2">
                    {child.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </dl>

      <section className="mt-8">
        <FormSheet
          trigger={
            <Button variant="outline" size="sm">
              Move status
            </Button>
          }
          title="Move status"
          description="A won or lost tender needs a recorded outcome reason."
          action={submitTenderStatus}
          submitLabel="Save status"
        >
          <input type="hidden" name="tenderId" value={tender.id.toString()} />
          <SelectField
            label="Status"
            name="status"
            defaultValue={tender.status}
            emptyLabel="Choose a status"
            options={STATUSES.map((s) => ({ value: s, label: s.replaceAll("_", " ") }))}
          />
          <SelectField
            label="Outcome reason"
            name="outcomeReasonId"
            defaultValue={tender.outcome_reason_id?.toString()}
            options={reasons.map((r) => ({ value: r.id.toString(), label: r.label }))}
          />
        </FormSheet>
        {reasons.length === 0 && (
          <p className="mt-3 text-[13px] text-(--c-muted)">
            No outcome reasons configured yet, so a tender cannot be marked won or lost. An
            administrator adds them.
          </p>
        )}
      </section>
    </div>
  );
}
