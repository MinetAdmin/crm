<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Working rules for this repo

Rules the user has set. They apply to every agent working here and to future
sessions. Add to this list when the user gives a new rule; do not remove one
without being asked.

## Comments

- Do not add unnecessary comments. Most code does not need one.
- A comment explains what a function or method does, or states a constraint the
  code cannot show. It is not a place for narration, history, or reasoning at
  length.
- Keep comments short and grammatical. No verbose block comments.
- While editing a file, delete comments that are unnecessary.

## Implementation

- Read and follow the project agent rules before starting work, including this
  file and the build pack in `docs/`.
- Reduce cyclomatic complexity when writing or touching code. Prefer small,
  focused functions and components over long branching handlers.
- Run `pnpm verify` before committing. A change is not finished while it fails.

## Writing

- Avoid em dashes.
- Avoid uppercase for emphasis unless asked for it.
- Keep a professional tone.

## Commits

- Commit your work when a piece of it is finished. Do not leave it sitting in
  the working tree.
- Commit with no affiliation: no `Co-Authored-By` trailer and no tool
  attribution in the message or PR body.
- Commit in clean, logical batches. Stage by path; one concern per commit.

## Discoveries

- Never leave a new discovery unattended. Fix it there and then if you can. If
  you cannot, record it where it will be picked up again (usually
  `docs/12-decision-log.md`) or hand it to another agent by name. Do not simply
  mention it and move on.

## Disagreement

- Always disagree when the evidence supports it, including with the user and
  with a design they have already proposed. Agreement is not the default.
- Back a disagreement with evidence: a `file:line`, a query result, a count
  from the data. An opinion without a citation is not a disagreement, it is a
  preference, and it should be labelled as one.
- Say plainly which parts of a proposal you accept and which you reject. Do not
  soften a rejection into a partial agreement.
- Separate what the evidence shows from what you inferred. When a
  recommendation rests on judgement rather than a citation, say so and name who
  should confirm it.
- If you never evaluated something, say that rather than implying a position.

## Data and sources

- Never invent data, statistics, sources, or references. Research and cite
  something real, or say plainly that there is no verified source.

## Design decisions

- The build pack in `docs/` is the source of truth for design. When the user
  delegates a design choice, decide within that scope and record the choice,
  reason, assumptions, and consequences in `docs/12-decision-log.md`, then
  propagate to the affected doc in the same commit.
- Distinguish adopted policy from verified data; do not turn missing facts into
  assumptions presented as evidence. Requirement and rule IDs (`FR-*`, `BR-*`,
  `NFR-*`, `D-*`) are defined in `docs/02-prd.md` and `docs/12-decision-log.md`;
  cite them rather than restating them.

## Domain rules (this CRM)

- Schema changes are a new numbered file in `db/migrations/`, a matching edit to
  `docs/schema.sql`, then `pnpm db:migrate && pnpm db:pull`. Never edit
  `prisma/schema.prisma` by hand and never edit an applied migration.
- Every business-entity mutation goes through `withAudit` in `src/lib/audit.ts`,
  in the same transaction as the change. There is no second write path.
- Stage changes go through the stage service endpoint only, which writes
  `stage_history`. Never update `opportunity.stage_id` directly.
- Derived figures (weighted amounts, rollups, gaps, totals) are computed in SQL
  views or at read time. Never store or accept them as input.
- Business rules (`BR-*`) are enforced at the point of saving and rejected with
  the doc 05 error contract citing the rule id. Do not turn a save-time rule
  into a report.
- Snapshot tables are immutable: insert and select only.
- Tender values on different `value_basis` are never summed.
- Row visibility is enforced server-side through the visibility guard on every
  query. Never rely on the client to scope data.
- Prisma is pinned to v6 (v7 dropped the classic `db pull` workflow). Do not
  upgrade it as a side effect of other work.
- No secrets in git. Env vars go in `.env.example` with empty values.

## Execute the assigned task

- Complete the assigned scope, run the relevant checks, commit your work, and
  hand back the result. Do not turn a bounded task into an open-ended
  discussion, review cycle, or project-wide improvement effort.
- Make routine, reversible implementation decisions yourself within the agreed
  scope and rules. Do not ask the user to approve each step or reconfirm
  existing authorization.
- Do not expand scope, implement unsolicited features, or refactor unrelated
  code. Necessary changes to complete the assigned task are in scope; adjacent
  improvements are not.
- The discoveries rule is not permission to expand scope. Record an unrelated
  finding once with evidence and a concrete follow-up, then continue your task.
- Escalate only when missing information, conflicting requirements, or an
  authorization boundary prevents safe progress. State the blocker, what you
  checked, and the smallest decision needed in one message.
- Once acceptance criteria and required checks are satisfied, stop. Deliver
  what changed, verification, commit references, and any recorded limitations.
