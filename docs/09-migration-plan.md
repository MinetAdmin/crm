# 09 — Data Migration Plan

Operationalises Spec §10. Principle unchanged: **cleanup decisions are made once, by the team,
in recorded artifacts — never improvised by whoever loads the file.** Migration runs as its own
track, parallel to the build, and has hard entry/exit gates.

## 0. Entry gates (nothing loads until all pass)

| Gate | Blocked by | Evidence of pass |
|---|---|---|
| G0.1 Authoritative source chosen | **F1** (BD RAW DATA.xlsx vs _3.xlsx; 172 vs 157 initiative rows, lost header, `#REF!`s) | Signed note naming the source file + hash; the other file archived read-only |
| G0.2 Money meaning settled | **C1** (commission vs premium) | If premium: schema change per doc 04 §4 executed *before* load |
| G0.3 Effective-month meaning settled | **C2** | Label + mapping rule recorded |
| G0.4 Grain decisions made | **F2** (Memnon Capital ×4: one deal or four? monthly Credit Life rows?) | Grain worksheet (§3 step 4 artifact) signed by BD |
| G0.5 Owner-target decision | **A1** | Determines whether owner-level targets load |
| G0.6 Controlled lists signed off | Workshop (§1 below) | Mapping workbook v1.0 signed |

## 1. The controlled-list workshop (Spec §10 step 1 — "the single highest-value hour")

Half-day, whole BD team + facilitator. Outputs, one tab each in a **mapping workbook**
(versioned in this repo under `migration/mappings/`):

1. **Product**: 24 current values → ~16 real products (Medical/MED/Med…, life/Life,
   Motor/MOTOR). Every current string mapped, none deleted.
2. **Unit / sector**: four spellings of UNIT resolved; `Dept` column mapped to sector codes
   (EMT, IND, SPE, SME, EBM); unit⊃sector assignment confirmed (I7 asked here).
3. **Stage + outcome**: each of the 12 mixed values → (stage, outcome) pair, including the
   lowercase `closed` duplicate. E.g. `Awarded → (last stage, won)`, `Lost → (last stage,
   lost)`, `On Hold → (stage, on_hold)`.
4. **Owners**: 16 strings → 6 users (A2). For each multi-owner string
   (`Helen/Evelyn/Edgar`, `Moses Ssewajja / Benjamin Mukasa`): who is accountable, who are
   co-owners. *A decision, not a cleanup task.*
5. **Lead sources, loss reasons, disqualification reasons, hold reasons, initiative statuses**
   (10 free-text variants → 5 managed), **cost categories** (D4: reuse finance's chart if it
   exists).
6. **Loss reasons for the 39 lost rows** captured *in this session* "while the context is
   still remembered" (§10 step 6).

## 2. Pipeline (repeatable, scripted)

ETL scripts live in `migration/` and run end-to-end from the untouched source file to a loaded
database — rerunnable after every mapping correction. No hand edits to intermediate files.

| Step | Task (Spec §10) | Implementation notes |
|---|---|---|
| 1 | Extract + profile | Parse the authoritative workbook; strip the 14 blank separator rows, rows 226–520 empty range, TOTAL rows, second header row, merged cells. Emit a profile report (row counts per sheet) to reconcile at step 8 |
| 2 | Apply mappings | Join every categorical column to the mapping workbook; **any unmapped value halts the run** and is added to the workbook — the mapping stays complete by construction |
| 3 | De-duplicate accounts | Normalised-name clustering + manual review sheet; output = account list with source-name → account crosswalk |
| 4 | Rebuild grain | Group 224 forecast rows into pursuits per the F2 grain worksheet; each original row becomes a schedule line under its parent opportunity. Keep `source_row_ref` on every migrated record for traceback |
| 5 | Fix dates | Excel serials → dates; month names resolved against year; TBA/TBD/N-A → `close_confidence = 'tbc'` + a real estimated date (BD supplies); correct 31/11/2026 (BD confirms intended date) |
| 6 | Stage + outcome split | Apply mapping tab 3; attach the workshop-captured loss reasons |
| 7 | Initiatives + links | Load register (F1-chosen version; E4 row-by-row reconciliation of the 172-vs-157 delta recorded in the mapping workbook); replace hard cell links and multi-client text blobs with `initiative_id` FKs. `#REF!`-broken links resolved from the mapped sheet + BD memory, decisions recorded |
| 8 | **Backfill stage history** | One `stage_history` row per opportunity: `to_stage` = migrated stage, `changed_at` = Last Update Date from the sheet, `backfilled = true`; same date to `stage_entered_at` + `stage_entry_backfilled` (Spec §16: labelled approximation, excluded from throughput) |
| 9 | Load targets | Initiative targets from register; owner targets iff A1; monthly phasing from the pack's phasing if I1 confirms, else flat |
| 10 | History depth per **F5** | Open pipeline always; won/lost history strongly recommended (unlocks win rate on day one, §16 table); 2025 actuals only if I1 brings them in scope |

## 3. Validation and reconciliation (exit gates)

| Gate | Check |
|---|---|
| G3.1 Structural | Load passes every schema constraint (by construction — constraint failures halt the run) |
| G3.2 Counts | Profile-report row counts = loaded record counts + explicitly excluded rows (each exclusion listed with a reason) |
| G3.3 **Money reconciliation** | Loaded Σ weighted pipeline = current sheet total, **every variance explained line by line** and signed off (Spec §10 step 8). Same for gross, per unit and per initiative |
| G3.4 Spot check | BD team reviews N=20 sampled opportunities against source rows in staging UAT |
| G3.5 Sign-off | BD lead signs the reconciliation statement; the mapped reconciliation sheet is formally retired; source workbooks locked read-only |

## 4. Cutover

1. Freeze the workbooks (announce date; edits after freeze are re-keyed by their author into
   the CRM after go-live — expect a handful, not a re-migration).
2. Final migration run against the frozen file → prod.
3. Gates G3.1–G3.5 re-run on prod load.
4. Go-live; workbooks archived with a tombstone note pointing at the CRM.
5. **F6 sweep**: ask each team member for any other BD spreadsheet in use; two divergent
   versions surfaced already, so assume more exist.

## 5. Effort shape (Spec §10 estimate, kept)

Steps 1–2 of §10 = one workshop. Account de-dup, grain rebuild, dates and stage split = the
bulk. The grain rebuild (step 4) is the only step needing BD judgement row by row; everything
else is scripted and rerunnable.
