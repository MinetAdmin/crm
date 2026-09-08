import { describe, expect, it } from "vitest";
import { diffForAudit } from "./audit";

describe("diffForAudit", () => {
  it("returns one change per differing field", () => {
    const changes = diffForAudit(
      { probability: 50, owner_id: 3, name: "Memnon Capital Medical 2026" },
      { probability: 70, owner_id: 3, name: "Memnon Capital Medical 2026" },
    );
    expect(changes).toEqual([{ field: "probability", oldValue: "50", newValue: "70" }]);
  });

  it("captures set and cleared fields against null", () => {
    const changes = diffForAudit({ key_blocker: null }, { key_blocker: "Awaiting board sign-off" });
    expect(changes).toEqual([
      { field: "key_blocker", oldValue: null, newValue: "Awaiting board sign-off" },
    ]);
  });

  it("serializes dates as ISO strings", () => {
    const changes = diffForAudit(
      { expected_close_date: new Date("2026-11-30T00:00:00Z") },
      { expected_close_date: new Date("2026-12-15T00:00:00Z") },
    );
    expect(changes[0]).toMatchObject({
      field: "expected_close_date",
      oldValue: "2026-11-30T00:00:00.000Z",
      newValue: "2026-12-15T00:00:00.000Z",
    });
  });

  it("ignores bookkeeping columns by default", () => {
    const changes = diffForAudit(
      { updated_at: new Date("2026-01-01"), last_login_at: null, stage_id: 1 },
      { updated_at: new Date("2026-02-01"), last_login_at: new Date("2026-02-01"), stage_id: 1 },
    );
    expect(changes).toEqual([]);
  });

  it("serializes bigint values", () => {
    const changes = diffForAudit({ owner_id: BigInt(3) }, { owner_id: BigInt(4) });
    expect(changes).toEqual([{ field: "owner_id", oldValue: "3", newValue: "4" }]);
  });

  it("reports fields that only exist on one side", () => {
    const changes = diffForAudit({}, { outcome: "lost" });
    expect(changes).toEqual([{ field: "outcome", oldValue: null, newValue: "lost" }]);
  });
});
