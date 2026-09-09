export type Role = "bd_owner" | "unit_head" | "bd_leadership" | "executive_ro" | "admin";

export type Viewer = { id: string; role: string; unitId: string | null };

export type Scope =
  | { kind: "all" }
  | { kind: "unit"; unitId: string }
  | { kind: "own"; userId: string }
  | { kind: "none" };

/**
 * Row visibility for pipeline records (doc 06 §2). Read is shared across BD
 * by decision D-11; write is narrower, which is where the roles differ.
 */
export function readScope(viewer: Viewer): Scope {
  switch (viewer.role) {
    case "admin":
      return { kind: "none" };
    case "bd_owner":
    case "unit_head":
    case "bd_leadership":
    case "executive_ro":
      return { kind: "all" };
    default:
      return { kind: "none" };
  }
}

export function writeScope(viewer: Viewer): Scope {
  switch (viewer.role) {
    case "bd_owner":
      return { kind: "own", userId: viewer.id };
    case "unit_head":
      return viewer.unitId ? { kind: "unit", unitId: viewer.unitId } : { kind: "none" };
    case "bd_leadership":
      return { kind: "all" };
    default:
      return { kind: "none" };
  }
}

export type RecordOwnership = { ownerId: string; unitId: string | null };

/** Whether a viewer may change a given record. */
export function canWrite(viewer: Viewer, record: RecordOwnership): boolean {
  const scope = writeScope(viewer);
  switch (scope.kind) {
    case "all":
      return true;
    case "unit":
      return record.unitId === scope.unitId;
    case "own":
      return record.ownerId === scope.userId;
    default:
      return false;
  }
}

export function canRead(viewer: Viewer, record: RecordOwnership): boolean {
  const scope = readScope(viewer);
  if (scope.kind === "all") return true;
  if (scope.kind === "unit") return record.unitId === scope.unitId;
  if (scope.kind === "own") return record.ownerId === scope.userId;
  return false;
}

/** Individual workload is visible to the person and their unit head (D-12). */
export function canSeeWorkloadOf(viewer: Viewer, subject: RecordOwnership): boolean {
  if (viewer.role === "bd_leadership") return true;
  if (viewer.id === subject.ownerId) return true;
  return viewer.role === "unit_head" && viewer.unitId === subject.unitId;
}

/** Administration is the admin's alone. */
export function canAdminister(viewer: Viewer): boolean {
  return viewer.role === "admin";
}
