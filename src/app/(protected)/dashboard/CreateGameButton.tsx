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
      className="group relative bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 
                 bg-size-200 bg-pos-0 hover:bg-pos-100 text-white font-bold py-4 px-8 
                 rounded-xl shadow-lg hover:shadow-xl shadow-purple-500/20
                 transform hover:scale-105 transition-all duration-300 
                 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                 flex items-center gap-3 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative flex items-center gap-3">
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Création en cours...</span>
          </>
        ) : (
          <>
            <span className="text-xl">⚡</span>
            <span>Créer une partie</span>
          </>
        )}
      </div>
    </button>
  );
}
