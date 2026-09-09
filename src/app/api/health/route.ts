import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Liveness and readiness probe (NFR-OPS-04).
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", db: "up" });
  } catch {
    return NextResponse.json({ status: "degraded", db: "down" }, { status: 503 });
  }
}
