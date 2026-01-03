"use server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function getTopPlayersByWins(limit: number = 20) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/stats/leaderboard/wins?limit=${limit}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return {
        success: false,
        error: "Erreur lors de la récupération du classement",
        data: [],
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Get top players by wins error:", error);
    return {
      success: false,
      error: "Une erreur est survenue",
      data: [],
    };
  }
}

export async function getTopPlayersByWinRatio(
  limit: number = 20,
  minGames: number = 5
) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/stats/leaderboard/ratio?limit=${limit}&minGames=${minGames}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return {
        success: false,
        error: "Erreur lors de la récupération du classement",
        data: [],
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Get top players by win ratio error:", error);
    return {
      success: false,
      error: "Une erreur est survenue",
      data: [],
    };
  }
}

export async function getTopPlayersByGamesPlayed(limit: number = 20) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/stats/leaderboard/games?limit=${limit}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return {
        success: false,
        error: "Erreur lors de la récupération du classement",
        data: [],
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Get top players by games played error:", error);
    return {
      success: false,
      error: "Une erreur est survenue",
      data: [],
    };
  }
}

