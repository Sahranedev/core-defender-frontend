import { SignupFormSchema, LoginFormSchema } from "./definitions";
import { z } from "zod";

// Configuration de l'API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/**
 * Récupère toutes les parties disponibles (en attente)
 */
export async function getAvailableGames(token: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/games/available`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        success: false,
        error: "Erreur lors de la récupération des parties",
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Get available games error:", error);
    return {
      success: false,
      error: "Une erreur est survenue",
    };
  }
}

/**
 * Crée une nouvelle partie
 */
export async function createGame(token: string, player1Id: number) {
  try {
    const response = await fetch(`${API_BASE_URL}/games/create`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ player1Id }),
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        success: false,
        error: "Erreur lors de la création de la partie",
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Create game error:", error);
    return {
      success: false,
      error: "Une erreur est survenue",
    };
  }
}

/**
 * Récupère les détails d'une partie par son roomId
 */
export async function getGameByRoomId(token: string, roomId: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/games/room/${roomId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        success: false,
        error: "Partie introuvable",
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Get game by roomId error:", error);
    return {
      success: false,
      error: "Une erreur est survenue",
    };
  }
}
