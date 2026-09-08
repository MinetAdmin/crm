import { PrismaClient } from "@prisma/client";

// One PrismaClient per process; Next.js dev hot-reload would otherwise leak
// connections, so the instance is cached on globalThis outside production.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
