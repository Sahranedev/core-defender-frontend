import { fetchAvailableGames } from "@/app/actions/games";
import { verifySession } from "@/app/lib/session";
import CreateGameButton from "./CreateGameButton";
import GamesList from "./GamesList";

export default async function DashboardPage() {
  const [result, session] = await Promise.all([
    fetchAvailableGames(),
    verifySession(),
  ]);

  const allGames = result.success ? result.data : [];
  const currentUserId = session?.userId ? parseInt(session.userId) : null;

  // Filtre les parties créées par l'utilisateur connecté
  const games = currentUserId
    ? allGames.filter((game: { player1: { id: number } }) => game.player1.id !== currentUserId)
    : allGames;

  return (
    <div className="p-6 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-4xl animate-pulse">⚔️</div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1">
                Arène de Combat
              </h1>
              <p className="text-slate-400 text-sm sm:text-base">
                Créez une partie ou rejoignez un adversaire
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <CreateGameButton />
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 shadow-xl shadow-black/20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Parties disponibles
              </h2>
            </div>
            <div className="px-3 py-1 bg-slate-700/50 rounded-full border border-slate-600">
              <span className="text-slate-300 text-sm font-semibold">
                {games.length} {games.length > 1 ? "parties" : "partie"}
              </span>
            </div>
          </div>

          {result.error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-4">
              <p className="text-red-400 text-sm">{result.error}</p>
            </div>
          )}

          <GamesList games={games} currentUserId={currentUserId} />
        </div>
      </div>
    </div>
  );
}
