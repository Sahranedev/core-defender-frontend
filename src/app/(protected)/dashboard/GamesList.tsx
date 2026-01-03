"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { io, Socket } from "socket.io-client";

interface Player {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
}

interface Game {
  id: number;
  roomId: string;
  status: string;
  player1: Player;
  player2: Player | null;
  createdAt: string;
}

interface GamesListProps {
  games: Game[];
  currentUserId: number | null;
}

export default function GamesList({
  games: initialGames,
  currentUserId,
}: GamesListProps) {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>(initialGames);

  useEffect(() => {
    const socket: Socket = io(
      process.env.NEXT_PUBLIC_WS_URL || "http://localhost:5000"
    );

    // Nouvelle room créée
    socket.on("game:roomCreated", (data: { roomId: string; game: Game }) => {
      setGames((prevGames) => {
        if (prevGames.some((g) => g.roomId === data.game.roomId)) {
          return prevGames;
        }
        return [data.game, ...prevGames];
      });
    });

    // Room démarrée → retrait de la liste
    socket.on("game:roomStarted", (data: { roomId: string }) => {
      setGames((prevGames) =>
        prevGames.filter((g) => g.roomId !== data.roomId)
      );
    });

    // Room annulée (le créateur est parti) → retrait de la liste
    socket.on("game:roomCancelled", (data: { roomId: string }) => {
      setGames((prevGames) =>
        prevGames.filter((g) => g.roomId !== data.roomId)
      );
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    setGames(initialGames);
  }, [initialGames]);

  // Filtre les parties pour ne pas afficher celles créées par l'utilisateur connecté
  const availableGames = useMemo(() => {
    if (!currentUserId) return games;
    return games.filter((game) => game.player1.id !== currentUserId);
  }, [games, currentUserId]);

  if (availableGames.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4 animate-bounce">🎮</div>
        <p className="text-slate-300 text-lg font-medium">
          Aucune partie disponible pour le moment
        </p>
        <p className="text-slate-500 text-sm mt-2">
          Créez la première partie et défiez vos amis !
        </p>
      </div>
    );
  }

  const handleJoinGame = (roomId: string) => {
    router.push(`/game/${roomId}`);
  };

  return (
    <div className="grid gap-4">
      {availableGames.map((game) => (
        <div
          key={game.id}
          className="group bg-gradient-to-br from-slate-700/40 to-slate-800/40 hover:from-slate-700/60 hover:to-slate-800/60 
                     border border-slate-600/50 hover:border-blue-500/50 rounded-xl p-6 
                     transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10
                     backdrop-blur-sm"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1 w-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-semibold border border-green-500/30">
                    En attente
                  </div>
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                <span className="text-slate-400 text-xs font-mono">
                  #{game.roomId.slice(-8)}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <div
                      className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full 
                                  flex items-center justify-center text-white font-bold text-sm shadow-lg"
                    >
                      {game.player1.firstname[0]}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-slate-800"></div>
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">
                      {game.player1.firstname} {game.player1.lastname}
                    </p>
                    <p className="text-slate-400 text-xs">Créateur</p>
                  </div>
                </div>

                <div className="text-slate-500 font-bold text-lg">VS</div>

                <div className="flex items-center gap-2">
                  <div
                    className="w-10 h-10 bg-slate-700/50 rounded-full border-2 border-dashed border-slate-500 
                                  flex items-center justify-center text-slate-500"
                  >
                    <span className="text-lg">?</span>
                  </div>
                  <div>
                    <p className="text-slate-400 font-medium text-sm">
                      En attente...
                    </p>
                    <p className="text-slate-500 text-xs">Adversaire</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2 text-slate-400">
                  <span>👥</span>
                  <span className="font-semibold text-white">1/2</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleJoinGame(game.roomId)}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 
                         text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl shadow-blue-500/20
                         transform hover:scale-105 transition-all duration-200
                         flex items-center justify-center gap-2 group-hover:shadow-blue-500/30"
            >
              <span className="text-lg">⚔️</span>
              <span>Rejoindre</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
