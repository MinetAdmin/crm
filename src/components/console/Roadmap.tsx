"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { findings, gates, lessons } from "./roadmap-data";

export function Roadmap() {
  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 pb-6">
      <section className="grid gap-3 border-b border-border pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Confirmed direction</Badge>
          <span className="text-xs text-muted-foreground">Reviewed 13 September 2026</span>
        </div>
        <p className="max-w-3xl text-xl font-semibold tracking-tight sm:text-2xl">
          Business Development, then account relationships and renewal growth.
        </p>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Complete the daily BD workflow and establish reliable access, history, and forecasts.
          Then deepen account relationships, organize renewals, and pursue expansion on the same account records.
        </p>
        <p className="text-xs text-muted-foreground">
          Direction confirmed in D-30. Work packages and release gates below are proposed.
          This is a review snapshot, not live delivery status.
        </p>
      </section>
      <ReleaseGates />
      <ReviewFindings />
      <RelationshipGrowth />
      <Research />
      <section className="grid gap-3 border-t border-border pt-5 text-sm">
        <h2 className="font-semibold">Decisions before release</h2>
        <p className="text-muted-foreground">
          BD and finance confirm money basis, effective periods, target phasing, and hold/reopen treatment.
          The project lead owns source data, migration grain, role visibility, and pilot scope.
          Relationship ownership, renewal-date provenance, and retention definitions shape the next phase.
        </p>
        <p className="text-xs text-muted-foreground">
          Source: CRM review and BD roadmap, doc 13. Baseline 0c90465 with targeted updates through 4e78cab.
          The review includes the completed sheets, account-table improvements, theme controls, and longlist.
          Findings remain open at publication. Authenticated usability and live infrastructure validation remain outstanding.
        </p>
      </section>
    </div>
  );
}

function ReleaseGates() {
  const [selected, setSelected] = useState(0);
  const [id, name, scope, exit] = gates[selected];

  return (
    <section className="grid gap-3" aria-labelledby="release-gates-heading">
      <h2 id="release-gates-heading" className="text-sm font-semibold">Proposed release gates</h2>
      <div className="flex flex-wrap gap-2" aria-label="Choose a release gate">
        {gates.map(([key, title], index) => (
          <Button key={key} variant={index === selected ? "secondary" : "ghost"} size="sm"
            aria-pressed={index === selected} aria-controls="gate-detail" onClick={() => setSelected(index)}>
            {key} · {title}
          </Button>
        ))}
      </div>
      <div id="gate-detail" className="grid gap-3 rounded-md border border-border p-4" aria-live="polite">
        <h3 className="text-sm font-semibold">{id} · {name}</h3>
        <p className="text-sm text-muted-foreground">{scope}</p>
        <p className="text-sm"><span className="font-medium">Ready to move on when: </span>{exit}</p>
      </div>
      <p className="text-xs text-muted-foreground">
        A staging pilot is separate from full BD acceptance. Re-estimate delivery dates after the foundation work is sized.
      </p>
    </section>
  );
}

function ReviewFindings() {
  const [priority, setPriority] = useState("All");
  const visible = findings.filter((item) => priority === "All" || item.priority === priority);

  return (
    <section className="grid gap-3" aria-labelledby="findings-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-1.5">
          <h2 id="findings-heading" className="text-sm font-semibold">Improvement priorities</h2>
          <p className="text-xs text-muted-foreground">Five release blockers and seven follow-up priorities identified in the review.</p>
        </div>
        <div className="flex gap-1" aria-label="Filter findings by priority">
          {["All", "P0", "P1"].map((value) => (
            <Button key={value} size="sm" variant={priority === value ? "secondary" : "ghost"}
              aria-pressed={priority === value} aria-controls="roadmap-findings" onClick={() => setPriority(value)}>
              {value === "All" ? "All findings" : value}
            </Button>
          ))}
        </div>
      </div>
      <p className="text-xs text-muted-foreground" role="status">Showing {visible.length} of {findings.length} findings. P0 blocks production use; P1 is required follow-up.</p>
      <ul id="roadmap-findings" className="divide-y divide-border border-y border-border">
        {visible.map((item) => (
          <li key={item.id} className="grid gap-2 py-3 sm:grid-cols-[6rem_1fr] sm:gap-3">
            <div className="flex items-start gap-2 text-xs">
              <Badge variant={item.priority === "P0" ? "destructive" : "secondary"}>{item.priority}</Badge>
              <span className="pt-0.5 text-muted-foreground">{item.id}</span>
            </div>
            <div className="grid gap-1.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-sm font-medium">{item.title}</h3>
                <span className="text-xs text-muted-foreground">{item.area} · Open at review</span>
              </div>
              <p className="text-sm text-muted-foreground">{item.next}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RelationshipGrowth() {
  return (
    <section className="grid gap-3" aria-labelledby="relationship-heading">
      <h2 id="relationship-heading" className="text-sm font-semibold">After BD: deepen the account relationship</h2>
      <ol className="grid gap-4 sm:grid-cols-3">
        {[
          ["Account relationships", "A named relationship owner, editable contacts, stakeholder roles, interaction history, and account plans with next actions."],
          ["Renewal worklists", "Verified renewal dates, prior-win or contract references, preparation reminders, and one pursuit per renewal period."],
          ["Expansion opportunities", "Distinct expansion pursuits on existing accounts, with product context and finance-approved reporting definitions."],
        ].map(([title, detail], index) => (
          <li key={title} className="grid content-start gap-2 border-l-2 border-border pl-3">
            <span className="text-xs text-muted-foreground">0{index + 1}</span>
            <h3 className="text-sm font-medium">{title}</h3>
            <p className="text-sm text-muted-foreground">{detail}</p>
          </li>
        ))}
      </ol>
      <p className="text-xs text-muted-foreground">
        Existing clients can start from their account. Renewal reminders do not count as forecast revenue.
        Policy administration, claims, and collection remain outside this commercial workflow.
      </p>
    </section>
  );
}

function Research() {
  return (
    <section className="grid gap-3" aria-labelledby="research-heading">
      <h2 id="research-heading" className="text-sm font-semibold">Patterns from established CRMs</h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {lessons.map((item) => (
          <li key={item.name} className="grid gap-1.5 rounded-md border border-border p-3">
            <a href={item.url} target="_blank" rel="noreferrer" className="flex w-fit items-center gap-1 text-sm font-medium underline-offset-4 hover:underline">
              {item.name}<ArrowUpRight className="size-3.5" aria-hidden="true" />
              <span className="sr-only"> official documentation (opens in a new tab)</span>
            </a>
            <p className="text-sm">{item.lesson}</p>
            <p className="text-xs text-muted-foreground">{item.adopt}</p>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">
        Official documentation reviewed 13 September 2026. These are workflow lessons, not a product ranking or purchasing recommendation.
      </p>
    </section>
  );
}
