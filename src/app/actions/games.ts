"use server";

import { verifySession } from "@/app/lib/session";
import { getAvailableGames, createGame } from "@/app/lib/api";

/**
 * Récupère toutes les parties disponibles
 */
export async function fetchAvailableGames() {
  const session = await verifySession();

  if (!session) {
    return {
      success: false,
      error: "Session expirée",
      data: [],
    };
  }

  return await getAvailableGames(session.jwt);
}

/**
 * Crée une nouvelle partie pour l'utilisateur connecté
 */
export async function createNewGame() {
  const session = await verifySession();

  console.log("Session dans createNewGame:", session);

  if (!session) {
    return {
      success: false,
      error: "Session expirée",
    };
  }

  // On récupère l'ID utilisateur depuis la session
  const userId = parseInt(session.userId);

  console.log("UserId:", userId, "JWT:", session.jwt ? "présent" : "absent");

  return await createGame(session.jwt, userId);
}
