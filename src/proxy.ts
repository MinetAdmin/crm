import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

// Session gate for all non-public routes. Edge-safe config only; the
// authorized callback decides and unauthenticated requests go to /signin.
// Public: the landing page at "/", the sign-in page, auth routes, the health
// probe and static assets. "/" renders the landing page when signed out and
// the console when signed in, so it gates itself.
export default auth(() => {});

export const config = {
  matcher: ["/((?!api/auth|api/health|_next/static|_next/image|favicon.ico|signin|$).*)"],
};
