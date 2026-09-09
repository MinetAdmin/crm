import { afterEach, describe, expect, it } from "vitest";
import { authEnvStatus } from "./env";

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

function withEnv(overrides: Record<string, string | undefined>) {
  process.env = { ...original, ...VALID, ...overrides };
}

function problems(): string[] {
  const status = authEnvStatus();
  return status.ready ? [] : status.problems;
}

describe("authEnvStatus", () => {
  it("is ready on a correct configuration", () => {
    withEnv({});
    expect(authEnvStatus()).toEqual({ ready: true });
  });

  it("never throws when nothing is configured, so a build can run bare", () => {
    process.env = { NODE_ENV: original.NODE_ENV };
    expect(() => authEnvStatus()).not.toThrow();
    expect(authEnvStatus().ready).toBe(false);
  });

  it("names each missing variable", () => {
    withEnv({ AUTH_SECRET: undefined, DATABASE_URL: undefined });
    expect(problems()).toEqual(["DATABASE_URL is not set", "AUTH_SECRET is not set"]);
  });

  it("catches a Secret ID pasted in place of the secret Value", () => {
    withEnv({ AUTH_MICROSOFT_ENTRA_ID_SECRET: "9f1c2d3e-4a5b-6c7d-8e9f-0a1b2c3d4e5f" });
    expect(problems().join()).toMatch(/Secret ID, not the secret Value/);
  });

  it("catches a multi-tenant issuer", () => {
    withEnv({ AUTH_MICROSOFT_ENTRA_ID_ISSUER: "https://login.microsoftonline.com/common/v2.0" });
    expect(problems().join()).toMatch(/pinned to the Minet tenant/);
  });

  it("catches a short AUTH_SECRET", () => {
    withEnv({ AUTH_SECRET: "too-short" });
    expect(problems().join()).toMatch(/at least 32 characters/);
  });
});
