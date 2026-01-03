/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { SessionPayload } from "@/app/lib/definitions";
import { cookies } from "next/headers";

const secretKey = process.env.SESSION_SECRET;

if (!secretKey && process.env.NODE_ENV === "production") {
  throw new Error(
    "SESSION_SECRET environment variable is required in production"
  );
}

const encodedKey = new TextEncoder().encode(
  secretKey || "dev_secret_key_change_in_production"
);

// Déterminer si nous sommes en environnement de production ou de développement
const isProduction = process.env.NODE_ENV === "production";

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload as any)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(encodedKey);
}

export async function decrypt(session: string | undefined = "") {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch {
    console.log("Failed to verify session");
  }
}

export async function createSession(
  jwtToken: string,
  email: string,
  userId?: string
) {
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 heures (aligné avec la durée du JWT)

  // On stocke le token JWT dans un cookie sécurisé
  const cookieStore = await cookies();
  cookieStore.set("jwt_token", jwtToken, {
    httpOnly: true,
    secure: isProduction, // Utiliser secure uniquement en production (HTTPS)
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });

  // On crée également notre propre session pour garder la compatibilité avec le code existant
  const session = await encrypt({
    userId: userId || "jwt_auth",
    email,
    expiresAt,
  });
  cookieStore.set("session", session, {
    httpOnly: true,
    secure: isProduction, // Utiliser secure uniquement en production (HTTPS)
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function updateSession() {
  const session = (await cookies()).get("session")?.value;
  const payload = await decrypt(session);

  if (!session || !payload) {
    return null;
  }

  const expires = new Date(Date.now() + 2 * 60 * 60 * 1000);

  const cookieStore = await cookies();
  cookieStore.set("session", session, {
    httpOnly: true,
    secure: isProduction, // Utiliser secure uniquement en production (HTTPS)
    expires: expires,
    sameSite: "lax",
    path: "/",
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  cookieStore.delete("jwt_token");
}

export async function getJwtToken() {
  const cookieStore = await cookies();
  return cookieStore.get("jwt_token")?.value;
}

export async function verifySession() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("session")?.value;
  const session = await decrypt(cookie);

  if (!session?.userId) {
    return null;
  }

  const jwtToken = cookieStore.get("jwt_token")?.value;
  if (!jwtToken) {
    return null;
  }

  return {
    userId: session.userId as string,
    email: session.email as string,
    jwt: jwtToken,
  };
}
