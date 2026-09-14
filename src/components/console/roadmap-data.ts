export const findings = [
  { id: "IP-01", priority: "P0", title: "Entity-specific authorization", area: "Backend", evidence: "src/lib/visibility.ts", line: 31, next: "Scope every query and action; test roles, parents, co-owners, and executive summaries." },
  { id: "IP-02", priority: "P0", title: "Session revocation", area: "Backend", evidence: "src/auth.ts", line: 149, next: "Recheck active status and current permissions after deactivation or role changes." },
  { id: "IP-03", priority: "P0", title: "Bootstrap and conversion races", area: "Backend", evidence: "src/auth.ts", line: 56, next: "Enforce single-winner bootstrap, conditional identity linking, and idempotent conversion." },
  { id: "IP-04", priority: "P0", title: "Qualification and next-action invariant", area: "Both", evidence: "src/lib/leads.ts", line: 135, next: "Convert with an accepted owner and dated first action; replace the last action atomically." },
  { id: "IP-05", priority: "P0", title: "Audit and conflict guarantees", area: "Backend", evidence: "src/lib/audit.ts", line: 66, next: "One audited command transaction with version checks and complete field differences." },
  { id: "IP-06", priority: "P1", title: "Validation and recoverable forms", area: "Both", evidence: "src/app/console/opportunities/actions.ts", line: 27, next: "Typed command input, field-level rule errors, retained values, and permission-aware controls." },
  { id: "IP-07", priority: "P1", title: "Published target sets", area: "Both", evidence: "src/lib/targets.ts", line: 78, next: "Separate drafts from published allocations; reconcile revisions and monthly phasing." },
  { id: "IP-08", priority: "P1", title: "Financial report dimensions", area: "Backend", evidence: "src/lib/forecast.ts", line: 111, next: "Fix year filters, stable-ID grouping, numeric ranking, and currency-safe totals." },
  { id: "IP-09", priority: "P1", title: "Movement and month-end timing", area: "Backend", evidence: "src/lib/movement.ts", line: 38, next: "Settle hold/reopen and movement attribution; verify EAT cutoff and late-capture recovery." },
  { id: "IP-10", priority: "P1", title: "Delivered alerts and report maturity", area: "Both", evidence: "scripts/jobs.ts", line: 24, next: "Turn console logs into traceable delivery, retries, catch-up, and honest maturity states." },
  { id: "IP-11", priority: "P1", title: "The BD owner's daily journey", area: "Frontend", evidence: "src/app/console/opportunities/page.tsx", line: 9, next: "My work, editable leads, activities, record context, search, and complete paginated totals." },
  { id: "IP-12", priority: "P1", title: "Executable docs and migration policy", area: "Docs", evidence: "docs/09-migration-plan.md", line: 49, next: "Resolve access/transport drift and classify source restatements before importing money." },
];
export const gates = [
  ["A", "Trustworthy foundation", "IP-01–06; real database proofs", "No unresolved P0; authorization, revocation, race, audit, and invariant tests pass."],
  ["B", "BD workflow in staging", "My work and complete deal lifecycle", "Owners and a unit head complete capture-to-handover journeys on desktop and phone."],
  ["C", "Controlled business pilot", "Correct reports, alerts, migration subset", "Signed money/grain decisions, reconciliation, verified snapshots, alerts, and restore."],
  ["D", "Complete Phase 1", "Remaining required BD capabilities", "Doc 10 launch criteria and T-SEED proofs pass; business administrator accepts handover."],
  ["E", "Relationship growth", "Accounts, renewal/expansion, selective integration", "Adoption evidence and named data/security owners justify the additional scope."],
  ["F", "Next CRM domain", "Consider servicing or pack after relationship growth", "Sponsor approves a separate domain scope; shared account/contact master is retained."],
];
export const lessons = [
  { name: "Salesforce", lesson: "Deal-level stakeholder roles", adopt: "Who influences this specific pursuit?", url: "https://help.salesforce.com/s/articleView?id=sf.sales_core_opp_contact_roles.htm&language=en_US&type=5" },
  { name: "HubSpot", lesson: "Tasks and records in one workspace", adopt: "Build a compact daily follow-up queue.", url: "https://knowledge.hubspot.com/sales-workspace/manage-sales-activities-in-the-updated-sales-workspace" },
  { name: "Dynamics 365 Sales", lesson: "Next actions with customer context", adopt: "Evaluate selective M365 integration after the core is reliable.", url: "https://learn.microsoft.com/en-us/dynamics365/sales/enable-configure-sales-accelerator" },
  { name: "Pipedrive", lesson: "Pipeline ordered by next activity", adopt: "Expose overdue, due-today, and missing actions in the list.", url: "https://support.pipedrive.com/en/article/how-are-deals-ordered-in-the-pipeline-view" },
];

