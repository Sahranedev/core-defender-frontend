"use client";

import { useRouter } from "next/navigation";

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
}

export default function GamesList({ games }: GamesListProps) {
  const router = useRouter();

  if (games.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🎮</div>
        <p className="text-slate-400 text-lg">
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
      {games.map((game) => (
        <div
          key={game.id}
          className="bg-slate-700/50 hover:bg-slate-700/70 border border-slate-600 rounded-xl p-6 
                     transition-all duration-200 hover:shadow-lg hover:border-slate-500"
        >
          <div className="flex items-center justify-between">
            {/* Infos de la partie */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-semibold">
                  En attente
                </div>
                <span className="text-slate-400 text-sm">
                  Room #{game.roomId.slice(-8)}
                </span>
              </div>

              <div className="flex items-center gap-4">
                {/* Joueur 1 */}
                <div className="flex items-center gap-2">
                  <div
                    className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full 
                                  flex items-center justify-center text-white font-bold"
                  >
                    {game.player1.firstname[0]}
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      {game.player1.firstname} {game.player1.lastname}
                    </p>
                    <p className="text-slate-400 text-sm">Créateur</p>
                  </div>
                </div>

                {/* VS */}
                <span className="text-slate-500 font-bold">VS</span>

                {/* Joueur 2 - En attente */}
                <div className="flex items-center gap-2">
                  <div
                    className="w-10 h-10 bg-slate-600 rounded-full border-2 border-dashed border-slate-500 
                                  flex items-center justify-center text-slate-400"
                  >
                    ?
                  </div>
                  <div>
                    <p className="text-slate-400 font-medium">En attente...</p>
                    <p className="text-slate-500 text-sm">Adversaire</p>
                  </div>
                </div>
              </div>

              {/* Joueurs compteur */}
              <div className="mt-3 flex items-center gap-2 text-sm">
                <span className="text-slate-400">👥 Joueurs:</span>
                <span className="text-white font-semibold">1/2</span>
              </div>
            </div>

            {/* Bouton Rejoindre */}
            <button
              onClick={() => handleJoinGame(game.roomId)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 
                         text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg 
                         transform hover:scale-105 transition-all duration-200
                         flex items-center gap-2"
            >
              <span>⚔️</span>
              Rejoindre
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
