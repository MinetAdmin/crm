import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/** The Prisma client, created on first use and reused per process. */
export function db(): PrismaClient {
  globalForPrisma.prisma ??= new PrismaClient();
  return globalForPrisma.prisma;
}
