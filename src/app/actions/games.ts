"use server";

import { verifySession } from "@/app/lib/session";
import { getAvailableGames, createGame, getGameByRoomId } from "@/app/lib/api";

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

  if (!session) {
    return {
      success: false,
      error: "Session expirée",
    };
  }

  const userId = parseInt(session.userId);

  return await createGame(session.jwt, userId);
}

/**
 * Récupère une partie par son roomId
 */
export async function fetchGameByRoomId(roomId: string) {
  const session = await verifySession();

  if (!session) {
    return {
      success: false,
      error: "Session expirée",
      data: null,
    };
  }

  return await getGameByRoomId(session.jwt, roomId);
}
