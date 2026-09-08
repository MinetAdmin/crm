import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

// Session gate for all non-public routes (Next 16 "proxy", formerly
// middleware). Uses the edge-safe config — no DB imports here. The
// `authorized` callback in auth.config.ts decides; unauthenticated requests
// are redirected to /signin by Auth.js.
export default auth(() => {
  // Decision happens in `authorized`; nothing extra per-request.
});

export const config = {
  // Everything except auth routes, health probe, sign-in page and static assets.
  matcher: ["/((?!api/auth|api/health|_next/static|_next/image|favicon.ico|signin).*)"],
};
