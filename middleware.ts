import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/app/lib/session";

// 1. Specify protected and public routes
const protectedPrefixes = ["/dashboard", "/game/"];
const authRoutes = ["/login", "/signup"];

export default async function middleware(req: NextRequest) {
  // 2. Check if the current route is protected or public
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedPrefixes.some((prefix) =>
    path.startsWith(prefix)
  );
  const isAuthRoute = authRoutes.includes(path);

  // 3. Vérifier la session via le JWT
  const session = await verifySession();

  // 4. Redirect to /login if the user is not authenticated and tries to access protected route
  if (isProtectedRoute && !session?.userId) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  // 5. Redirect to /dashboard if the user is authenticated and tries to access login/signup
  if (isAuthRoute && session?.userId) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
}

// Routes Middleware should not run on
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
