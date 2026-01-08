"use server";

import { verifySession } from "@/app/lib/session";
import { getUserProfile } from "@/app/lib/api";

export interface UserProfile {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  isVerified: boolean;
  stats: {
    wins: number;
    losses: number;
    totalGames: number;
    winRatio: number;
  };
  recentGames: Array<{
    id: number;
    roomId: string;
    opponent: { id: number; firstname: string; lastname: string } | null;
    result: "win" | "loss" | "in_progress";
    duration: number | null;
    createdAt: string;
    finishedAt: string | null;
  }>;
}

/**
 * Récupère le profil de l'utilisateur connecté
 */
export async function fetchMyProfile(): Promise<{
  success: boolean;
  error?: string;
  data?: UserProfile;
}> {
  const session = await verifySession();

  if (!session) {
    return {
      success: false,
      error: "Session expirée",
    };
  }

  const userId = parseInt(session.userId);
  return await getUserProfile(session.jwt, userId);
}

/**
 * Récupère le profil d'un utilisateur par son ID
 */
export async function fetchUserProfile(userId: number): Promise<{
  success: boolean;
  error?: string;
  data?: UserProfile;
}> {
  const session = await verifySession();

  if (!session) {
    return {
      success: false,
      error: "Session expirée",
    };
  }

  return await getUserProfile(session.jwt, userId);
}
