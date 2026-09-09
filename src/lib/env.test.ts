import { afterEach, describe, expect, it } from "vitest";
import { validateEnv } from "./env";

const VALID = {
  DATABASE_URL: "postgresql://localhost:5432/crmdev",
  AUTH_SECRET: "x".repeat(43),
  AUTH_MICROSOFT_ENTRA_ID_ID: "3416f6f0-e829-425e-a2e5-4bd54ca35134",
  AUTH_MICROSOFT_ENTRA_ID_SECRET: "abc8Q~notarealsecretvalue.forTestsOnly1",
  AUTH_MICROSOFT_ENTRA_ID_ISSUER:
    "https://login.microsoftonline.com/3416f6f0-e829-425e-a2e5-4bd54ca35134/v2.0",
};

const original = { ...process.env };

afterEach(() => {
  process.env = { ...original };
});

function withEnv(overrides: Record<string, string>) {
  process.env = { ...original, ...VALID, ...overrides };
}

describe("validateEnv", () => {
  it("accepts a correct configuration", () => {
    withEnv({});
    expect(() => validateEnv()).not.toThrow();
  });

  it("rejects a Secret ID pasted in place of the secret Value", () => {
    withEnv({ AUTH_MICROSOFT_ENTRA_ID_SECRET: "9f1c2d3e-4a5b-6c7d-8e9f-0a1b2c3d4e5f" });
    expect(() => validateEnv()).toThrow(/Secret ID, not the secret Value/);
  });

  it("rejects a multi-tenant issuer", () => {
    withEnv({
      AUTH_MICROSOFT_ENTRA_ID_ISSUER: "https://login.microsoftonline.com/common/v2.0",
    });
    expect(() => validateEnv()).toThrow(/pinned to the Minet tenant/);
  });

  it("skips validation during the production build", () => {
    withEnv({ AUTH_SECRET: "", NEXT_PHASE: "phase-production-build" });
    expect(() => validateEnv()).not.toThrow();
  });

  it("rejects a short AUTH_SECRET", () => {
    withEnv({ AUTH_SECRET: "too-short" });
    expect(() => validateEnv()).toThrow(/at least 32 characters/);
  });
});
