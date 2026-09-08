import { PrismaClient } from "@prisma/client";

// One PrismaClient per process, cached on globalThis outside production so
// Next.js dev hot reload does not leak connections.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
