import { fetchAvailableGames } from "@/app/actions/games";
import CreateGameButton from "./CreateGameButton";
import GamesList from "./GamesList";

export default async function DashboardPage() {
  const result = await fetchAvailableGames();
  const games = result.success ? result.data : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🎮 Bloc Défenseur
          </h1>
          <p className="text-slate-400">
            Créez une partie ou rejoignez un adversaire
          </p>
        </div>

        {/* Actions */}
        <div className="mb-8">
          <CreateGameButton />
        </div>

        {/* Liste des parties */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="text-green-400">●</span>
              Parties disponibles
            </h2>
            <span className="text-slate-400 text-sm">
              {games.length} {games.length > 1 ? "parties" : "partie"} en
              attente
            </span>
          </div>

          {result.error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-4">
              <p className="text-red-400">{result.error}</p>
            </div>
          )}

          <GamesList games={games} />
        </div>
      </div>
    </div>
  );
}
