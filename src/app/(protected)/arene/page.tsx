import { fetchAvailableGames } from "@/app/actions/games";
import { verifySession } from "@/app/lib/session";
import CreateGameButton from "./CreateGameButton";
import JoinPrivateGame from "./JoinPrivateGame";
import GamesList from "./GamesList";
import { LuSwords, LuCircleDot } from "react-icons/lu";

export default async function ArenePage() {
  const [result, session] = await Promise.all([
    fetchAvailableGames(),
    verifySession(),
  ]);

  const allGames = result.success ? result.data : [];
  const currentUserId = session?.userId ? parseInt(session.userId) : null;

  // Filtre les parties créées par l'utilisateur connecté
  const games = currentUserId
    ? allGames.filter(
        (game: { player1: { id: number } }) => game.player1.id !== currentUserId
      )
    : allGames;

  return (
    <div className="min-h-screen bg-zinc-950 p-6 sm:p-8">
      {/* Grid pattern background */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none"></div>

      <div className="relative max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 bg-zinc-900 border-2 border-cyan-500/30 rounded-xl flex items-center justify-center">
              <LuSwords className="w-7 h-7 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-4xl sm:text-5xl font-black text-white uppercase tracking-tight">
                Arène de Combat
              </h1>
              <p className="text-zinc-500 text-sm sm:text-base font-medium mt-1">
                Créez une partie ou rejoignez un adversaire
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8 flex flex-col lg:flex-row lg:items-start gap-6">
          <CreateGameButton />
          <div className="lg:flex-1 lg:max-w-md">
            <JoinPrivateGame />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <LuCircleDot className="w-5 h-5 text-green-400 animate-pulse" />
              <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                Parties disponibles
              </h2>
            </div>
            <div className="px-4 py-2 bg-zinc-800 rounded-lg border border-zinc-700">
              <span className="text-zinc-300 text-sm font-bold">
                {games.length} {games.length > 1 ? "parties" : "partie"}
              </span>
            </div>
          </div>

          {result.error && (
            <div className="bg-red-950/50 border border-red-800 rounded-lg p-4 mb-4">
              <p className="text-red-400 text-sm">{result.error}</p>
            </div>
          )}

          <GamesList games={games} currentUserId={currentUserId} />
        </div>
      </div>
    </div>
  );
}
