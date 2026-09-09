import NextAuth from "next-auth";
import { NextResponse, type NextRequest } from "next/server";

import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);
const gate = auth(() => undefined);

/** Session gate for every route the matcher covers. Unconfigured means open. */
export default function proxy(request: NextRequest, event: unknown) {
  if (!process.env.AUTH_SECRET) return NextResponse.next();
  return (gate as unknown as (req: NextRequest, ev: unknown) => Response)(request, event);
}

export const config = {
  matcher: ["/((?!api/auth|api/health|_next/static|_next/image|favicon.ico|signin|$).*)"],
};
