import { z } from "zod";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
  AUTH_MICROSOFT_ENTRA_ID_ID: z.string().regex(UUID, "must be the Application (client) ID"),
  AUTH_MICROSOFT_ENTRA_ID_SECRET: z
    .string()
    .min(1)
    // Entra secret values are never UUIDs; a UUID here means the Secret ID was
    // copied instead of the Value, which fails at token exchange as invalid_client.
    .refine((v) => !UUID.test(v), "is the Secret ID, not the secret Value"),
  AUTH_MICROSOFT_ENTRA_ID_ISSUER: z
    .string()
    .url()
    .refine(
      (v) => !v.includes("/common/") && !v.includes("/organizations/"),
      "must be pinned to the Minet tenant id, not /common or /organizations",
    ),
});

/** Validates auth and database env vars, failing fast with a readable message. */
export function validateEnv(): void {
  const result = schema.safeParse(process.env);
  if (result.success) return;
  const lines = result.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`);
  throw new Error(`Environment is not configured correctly:\n${lines.join("\n")}`);
}
