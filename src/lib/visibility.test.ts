import { describe, expect, it } from "vitest";
import { canAdminister, canRead, canSeeWorkloadOf, canWrite } from "./visibility";

const owner = { id: "1", role: "bd_owner", unitId: "10" };
const otherOwner = { id: "2", role: "bd_owner", unitId: "10" };
const head = { id: "3", role: "unit_head", unitId: "10" };
const otherHead = { id: "4", role: "unit_head", unitId: "20" };
const lead = { id: "5", role: "bd_leadership", unitId: null };
const exec = { id: "6", role: "executive_ro", unitId: null };
const admin = { id: "7", role: "admin", unitId: null };

const record = { ownerId: "1", unitId: "10" };

describe("read", () => {
  it("is shared across BD, so the forecast can be assembled", () => {
    for (const viewer of [owner, otherOwner, head, lead, exec]) {
      expect(canRead(viewer, record)).toBe(true);
    }
  });

  it("does not follow from being an administrator", () => {
    expect(canRead(admin, record)).toBe(false);
  });
});

describe("write", () => {
  it("lets an owner change their own record", () => {
    expect(canWrite(owner, record)).toBe(true);
  });

  it("stops an owner changing someone else's", () => {
    expect(canWrite(otherOwner, record)).toBe(false);
  });

  it("lets a unit head change anything in their unit", () => {
    expect(canWrite(head, record)).toBe(true);
  });

  it("stops a unit head reaching into another unit", () => {
    expect(canWrite(otherHead, record)).toBe(false);
  });

  it("lets leadership change anything", () => {
    expect(canWrite(lead, record)).toBe(true);
  });

  it("gives an executive reader nothing to write", () => {
    expect(canWrite(exec, record)).toBe(false);
  });

  it("gives an administrator no business writes", () => {
    expect(canWrite(admin, record)).toBe(false);
  });
});

describe("workload visibility", () => {
  it("shows a person their own load", () => {
    expect(canSeeWorkloadOf(owner, record)).toBe(true);
  });

  it("hides a peer's load from another owner", () => {
    expect(canSeeWorkloadOf(otherOwner, record)).toBe(false);
  });

  it("shows a unit head their own unit", () => {
    expect(canSeeWorkloadOf(head, record)).toBe(true);
    expect(canSeeWorkloadOf(otherHead, record)).toBe(false);
  });
});

describe("administration", () => {
  it("belongs to the admin alone", () => {
    expect(canAdminister(admin)).toBe(true);
    for (const viewer of [owner, head, lead, exec]) {
      expect(canAdminister(viewer)).toBe(false);
    }
  });
});
