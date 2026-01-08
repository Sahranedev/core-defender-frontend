import "server-only";
import { cookies } from "next/headers";

// Déterminer si nous sommes en environnement de production ou de développement
const isProduction = process.env.NODE_ENV === "production";

/**
 * Interface pour le payload décodé du JWT
 */
interface JwtPayload {
  sub: string | number;
  email: string;
  exp?: number;
  iat?: number;
}

/**
 * Décode un JWT sans vérifier la signature (la vérification est faite côté backend)
 */
function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch {
    return null;
  }
}

/**
 * Crée une session en stockant le JWT dans un cookie sécurisé
 */
export async function createSession(jwtToken: string) {
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 heures

  const cookieStore = await cookies();
  cookieStore.set("jwt_token", jwtToken, {
    httpOnly: true,
    secure: isProduction,
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

/**
 * Supprime la session (déconnexion)
 */
export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("jwt_token");
}

/**
 * Récupère le token JWT depuis les cookies
 */
export async function getJwtToken() {
  const cookieStore = await cookies();
  return cookieStore.get("jwt_token")?.value;
}

/**
 * Vérifie la session et retourne les infos utilisateur
 */
export async function verifySession() {
  const jwtToken = await getJwtToken();

  if (!jwtToken) {
    return null;
  }

  const payload = decodeJwt(jwtToken);
  if (!payload) {
    return null;
  }

  // Vérifier si le token n'est pas expiré
  if (payload.exp && payload.exp * 1000 < Date.now()) {
    return null;
  }

  return {
    userId: payload.sub?.toString(),
    email: payload.email,
    jwt: jwtToken,
  };
}

/**
 * Vérifie si l'utilisateur est authentifié (pour le middleware)
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await verifySession();
  return session !== null;
}
