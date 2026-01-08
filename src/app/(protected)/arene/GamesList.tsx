"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { io, Socket } from "socket.io-client";
import { LuGamepad2, LuUsers, LuSwords, LuCircle } from "react-icons/lu";

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
      process.env.NEXT_PUBLIC_WS_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:5000"
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
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-zinc-800 border-2 border-zinc-700 rounded-xl mb-6">
          <LuGamepad2 className="w-10 h-10 text-zinc-600" />
        </div>
        <p className="text-white text-lg font-bold mb-2">
          Aucune partie disponible pour le moment
        </p>
        <p className="text-zinc-500 text-sm">
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
          className="group bg-zinc-800 hover:bg-zinc-800/80 
                     border border-zinc-700 hover:border-cyan-500/50 rounded-xl p-6 
                     transition-all duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.1)]"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1 w-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <div className="bg-green-950/50 text-green-400 px-3 py-1.5 rounded-lg text-xs font-bold border border-green-800 uppercase tracking-wide flex items-center gap-2">
                    <LuCircle className="w-3 h-3 fill-current animate-pulse" />
                    En attente
                  </div>
                </div>
                <span className="text-zinc-500 text-xs font-mono font-semibold">
                  #{game.roomId.slice(-8)}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div
                      className="w-11 h-11 bg-cyan-500 rounded-lg 
                                  flex items-center justify-center text-zinc-950 font-black text-base shadow-lg"
                    >
                      {game.player1.firstname[0]}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-cyan-400 rounded border-2 border-zinc-800"></div>
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">
                      {game.player1.firstname} {game.player1.lastname}
                    </p>
                    <p className="text-zinc-500 text-xs font-medium uppercase tracking-wide">
                      Créateur
                    </p>
                  </div>
                </div>

                <div className="text-zinc-600 font-black text-xl">
                  <LuSwords className="w-5 h-5" />
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 bg-zinc-900 rounded-lg border-2 border-dashed border-zinc-700 
                                  flex items-center justify-center text-zinc-600"
                  >
                    <span className="text-xl font-bold">?</span>
                  </div>
                  <div>
                    <p className="text-zinc-500 font-bold text-sm">
                      En attente...
                    </p>
                    <p className="text-zinc-600 text-xs font-medium uppercase tracking-wide">
                      Adversaire
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2 text-zinc-500">
                  <LuUsers className="w-4 h-4" />
                  <span className="font-bold text-white">1/2 joueurs</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleJoinGame(game.roomId)}
              className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-400
                         text-zinc-950 font-black py-3 px-6 rounded-lg hover:shadow-[0_0_25px_rgba(6,182,212,0.3)]
                         transform hover:scale-105 transition-all duration-200
                         flex items-center justify-center gap-2 uppercase tracking-wide text-sm"
            >
              <LuSwords className="w-4 h-4" />
              <span>Rejoindre</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
