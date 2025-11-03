"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createNewGame } from "../../actions/games";

export default function CreateGameButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleCreateGame = async () => {
    setIsLoading(true);

    try {
      const result = await createNewGame();

      if (result.success && result.data) {
        // Redirection vers la page de jeu avec le roomId
        router.push(`/game/${result.data.roomId}`);
      } else {
        alert(result.error || "Erreur lors de la création de la partie");
      }
    } catch (error) {
      console.error("Error creating game:", error);
      alert("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleCreateGame}
      disabled={isLoading}
      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 
                 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl 
                 transform hover:scale-105 transition-all duration-200 
                 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                 flex items-center gap-3"
    >
      {isLoading ? (
        <>
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Création en cours...
        </>
      ) : (
        <>
          <span className="text-2xl">+</span>
          Créer une partie
        </>
      )}
    </button>
  );
}
