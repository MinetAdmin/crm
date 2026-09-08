import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

// Session gate for all non-public routes. Edge-safe config only; the
// authorized callback decides and unauthenticated requests go to /signin.
export default auth(() => {});

export const config = {
  matcher: ["/((?!api/auth|api/health|_next/static|_next/image|favicon.ico|signin).*)"],
};
