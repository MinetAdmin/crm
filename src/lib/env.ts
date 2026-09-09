import { z } from "zod";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const REQUIRED = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "AUTH_MICROSOFT_ENTRA_ID_ID",
  "AUTH_MICROSOFT_ENTRA_ID_SECRET",
  "AUTH_MICROSOFT_ENTRA_ID_ISSUER",
] as const;

const shape = z.object({
  AUTH_SECRET: z.string().min(32, "must be at least 32 characters"),
  AUTH_MICROSOFT_ENTRA_ID_ID: z.string().regex(UUID, "must be the Application (client) ID"),
  AUTH_MICROSOFT_ENTRA_ID_SECRET: z
    .string()
    .refine((v) => !UUID.test(v), "is the Secret ID, not the secret Value"),
  AUTH_MICROSOFT_ENTRA_ID_ISSUER: z
    .string()
    .refine((v) => URL.canParse(v), "must be a URL")
    .refine(
      (v) => !v.includes("/common/") && !v.includes("/organizations/"),
      "must be pinned to the Minet tenant id, not /common or /organizations",
    ),
});

export type EnvStatus = { ready: true } | { ready: false; problems: string[] };

/** Whether the app has everything it needs to sign anyone in. Never throws. */
export function authEnvStatus(): EnvStatus {
  const missing = REQUIRED.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    return { ready: false, problems: missing.map((key) => `${key} is not set`) };
  }

  const result = shape.safeParse(process.env);
  if (result.success) return { ready: true };

  return {
    ready: false,
    problems: result.error.issues.map((i) => `${i.path.join(".")} ${i.message}`),
  };
}
