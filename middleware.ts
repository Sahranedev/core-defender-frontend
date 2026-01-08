import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/app/lib/session";

// 1. Specify protected and public routes

const protectedPrefixes = ["/arene", "/game/"];
const authRoutes = ["/login", "/signup"];

export default async function middleware(req: NextRequest) {
  // 2. Vérifier si la route actuelle est protégée ou publique
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedPrefixes.some((prefix) =>
    path.startsWith(prefix)
  );
  const isAuthRoute = authRoutes.includes(path);

  // 3. Vérifier la session via le JWT
  const session = await verifySession();

  // 4. Rediriger vers la page de connexion si l'utilisateur n'est pas authentifié et essaie d'accéder à une route protégée
  if (isProtectedRoute && !session?.userId) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  // 5. On redirige sur la page /d'arène si l'utilisateur est déjà authentifié et essaie d'accéder à une route d'authentification
  if (isAuthRoute && session?.userId) {
    return NextResponse.redirect(new URL("/arene", req.nextUrl));
  }

  return NextResponse.next();
}

// Routes Middleware should not run on
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
