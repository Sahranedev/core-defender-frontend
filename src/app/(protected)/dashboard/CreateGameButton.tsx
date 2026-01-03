"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createNewGame } from "../../actions/games";
import { LuZap, LuLock, LuCopy, LuCheck } from "react-icons/lu";

interface PrivateGameModalProps {
  privateCode: string;
  roomId: string;
  onClose: () => void;
  onContinue: () => void;
}

function PrivateGameModal({
  privateCode,
  onClose,
  onContinue,
}: PrivateGameModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(privateCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500/20 rounded-full mb-4">
            <LuLock className="w-8 h-8 text-purple-400" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">
            Partie Privée Créée !
          </h2>
          <p className="text-zinc-400 text-sm">
            Partagez ce code avec votre ami pour qu&apos;il puisse vous
            rejoindre
          </p>
        </div>

        <div className="bg-zinc-800 border-2 border-dashed border-zinc-600 rounded-xl p-6 mb-6">
          <p className="text-zinc-500 text-xs uppercase tracking-wide mb-2 text-center">
            Code de la partie
          </p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-4xl font-mono font-black text-cyan-400 tracking-[0.3em]">
              {privateCode}
            </span>
            <button
              onClick={handleCopy}
              className="p-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
              title="Copier le code"
            >
              {copied ? (
                <LuCheck className="w-5 h-5 text-green-400" />
              ) : (
                <LuCopy className="w-5 h-5 text-zinc-400" />
              )}
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-3 px-4 rounded-xl transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onContinue}
            className="flex-1 bg-purple-500 hover:bg-purple-400 text-white font-bold py-3 px-4 rounded-xl transition-colors"
          >
            Continuer
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CreateGameButton() {
  const [isLoading, setIsLoading] = useState<"public" | "private" | null>(null);
  const [privateGameData, setPrivateGameData] = useState<{
    privateCode: string;
    roomId: string;
  } | null>(null);
  const router = useRouter();

  const handleCreateGame = async (isPrivate: boolean) => {
    setIsLoading(isPrivate ? "private" : "public");

    try {
      const result = await createNewGame(isPrivate);

      if (result.success && "data" in result && result.data) {
        if (isPrivate && result.data.privateCode) {
          // Affiche le modal avec le code
          setPrivateGameData({
            privateCode: result.data.privateCode,
            roomId: result.data.roomId,
          });
        } else {
          // Partie publique : redirection directe
          router.push(`/game/${result.data.roomId}`);
        }
      } else {
        alert(
          "error" in result
            ? result.error
            : "Erreur lors de la création de la partie"
        );
      }
    } catch (error) {
      console.error("Error creating game:", error);
      alert("Une erreur est survenue");
    } finally {
      setIsLoading(null);
    }
  };

  const handleCloseModal = () => {
    setPrivateGameData(null);
  };

  const handleContinueToGame = () => {
    if (privateGameData) {
      router.push(`/game/${privateGameData.roomId}`);
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Bouton Partie Publique */}
        <button
          onClick={() => handleCreateGame(false)}
          disabled={isLoading !== null}
          className="group bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-black py-4 px-8 
                     rounded-xl hover:shadow-[0_0_40px_rgba(6,182,212,0.4)]
                     transform hover:scale-105 transition-all duration-200 
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                     flex items-center justify-center gap-3 uppercase tracking-wide"
        >
          {isLoading === "public" ? (
            <>
              <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
              <span>Création...</span>
            </>
          ) : (
            <>
              <LuZap className="w-5 h-5" />
              <span>Partie Publique</span>
            </>
          )}
        </button>

        {/* Bouton Partie Privée */}
        <button
          onClick={() => handleCreateGame(true)}
          disabled={isLoading !== null}
          className="group bg-purple-500 hover:bg-purple-400 text-white font-black py-4 px-8 
                     rounded-xl hover:shadow-[0_0_40px_rgba(168,85,247,0.4)]
                     transform hover:scale-105 transition-all duration-200 
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                     flex items-center justify-center gap-3 uppercase tracking-wide"
        >
          {isLoading === "private" ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Création...</span>
            </>
          ) : (
            <>
              <LuLock className="w-5 h-5" />
              <span>Partie Privée</span>
            </>
          )}
        </button>
      </div>

      {/* Modal pour afficher le code privé */}
      {privateGameData && (
        <PrivateGameModal
          privateCode={privateGameData.privateCode}
          roomId={privateGameData.roomId}
          onClose={handleCloseModal}
          onContinue={handleContinueToGame}
        />
      )}
    </>
  );
}
