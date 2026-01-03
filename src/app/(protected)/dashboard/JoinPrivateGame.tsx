"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchGameByPrivateCode } from "../../actions/games";
import { LuKey, LuArrowRight } from "react-icons/lu";

export default function JoinPrivateGame() {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (code.length < 6) {
      setError("Le code doit contenir 6 caractères");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchGameByPrivateCode(code);

      if (result.success && result.data) {
        // Vérifie que la partie est toujours en attente
        if (result.data.status !== "waiting") {
          setError("Cette partie a déjà commencé ou est terminée");
          return;
        }

        // Redirige vers la partie
        router.push(`/game/${result.data.roomId}`);
      } else {
        setError("Code invalide ou partie introuvable");
      }
    } catch (err) {
      console.error("Error joining private game:", err);
      setError("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Convertit en majuscules et limite à 6 caractères
    const value = e.target.value.toUpperCase().slice(0, 6);
    setCode(value);
    setError(null);
  };

  return (
    <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-purple-500/20 rounded-lg">
          <LuKey className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h3 className="text-white font-bold">Rejoindre une partie privée</h3>
          <p className="text-zinc-500 text-sm">
            Entrez le code partagé par votre ami
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="flex-1">
          <input
            type="text"
            value={code}
            onChange={handleCodeChange}
            placeholder="ABC123"
            className="w-full bg-zinc-900 border border-zinc-600 focus:border-purple-500 
                       rounded-lg px-4 py-3 text-white font-mono text-lg tracking-[0.2em] 
                       placeholder:text-zinc-600 placeholder:tracking-[0.2em]
                       focus:outline-none focus:ring-2 focus:ring-purple-500/30
                       uppercase text-center"
            maxLength={6}
            disabled={isLoading}
          />
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading || code.length < 6}
          className="bg-purple-500 hover:bg-purple-400 disabled:bg-zinc-700 
                     text-white font-bold px-6 rounded-lg transition-colors
                     disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span className="hidden sm:inline">Rejoindre</span>
              <LuArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
