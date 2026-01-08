import { fetchMyProfile } from "@/app/actions/profile";
import { redirect } from "next/navigation";
import {
  LuUser,
  LuTrophy,
  LuTarget,
  LuSwords,
  LuPercent,
  LuHistory,
  LuCrown,
  LuSkull,
  LuClock,
  LuMail,
  LuShieldCheck,
} from "react-icons/lu";

function formatDuration(seconds: number | null): string {
  if (!seconds) return "-";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ProfilePage() {
  const result = await fetchMyProfile();

  if (!result.success || !result.data) {
    redirect("/login");
  }

  const profile = result.data;

  return (
    <div className="min-h-screen bg-zinc-950 p-6 sm:p-8">
      {/* Grid pattern background */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none"></div>

      <div className="relative max-w-5xl mx-auto space-y-8">
        {/* Header du profil */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 bg-gradient-to-br from-cyan-600 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <span className="text-4xl font-black text-white uppercase">
                {profile.firstname[0]}
                {profile.lastname[0]}
              </span>
            </div>

            {/* Infos utilisateur */}
            <div className="flex-1 space-y-3">
              <div>
                <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
                  {profile.firstname} {profile.lastname}
                </h1>
                <div className="flex items-center gap-2 mt-2">
                  <LuMail className="w-4 h-4 text-zinc-500" />
                  <span className="text-zinc-400 text-sm">{profile.email}</span>
                  {profile.isVerified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-950/50 border border-green-500/30 rounded text-xs text-green-400">
                      <LuShieldCheck className="w-3 h-3" />
                      Vérifié
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Badge rang (optionnel futur) */}
            <div className="hidden sm:flex flex-col items-center gap-2 px-6 py-4 bg-zinc-800/50 border border-zinc-700 rounded-xl">
              <LuUser className="w-8 h-8 text-cyan-400" />
              <span className="text-xs text-zinc-500 uppercase tracking-wide">
                Joueur
              </span>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Victoires */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-green-500/30 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-950/50 border border-green-500/30 rounded-lg flex items-center justify-center">
                <LuTrophy className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-zinc-500 text-sm font-medium uppercase tracking-wide">
                Victoires
              </span>
            </div>
            <p className="text-3xl font-black text-white">
              {profile.stats.wins}
            </p>
          </div>

          {/* Défaites */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-red-500/30 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-950/50 border border-red-500/30 rounded-lg flex items-center justify-center">
                <LuSkull className="w-5 h-5 text-red-400" />
              </div>
              <span className="text-zinc-500 text-sm font-medium uppercase tracking-wide">
                Défaites
              </span>
            </div>
            <p className="text-3xl font-black text-white">
              {profile.stats.losses}
            </p>
          </div>

          {/* Parties jouées */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-cyan-500/30 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-cyan-950/50 border border-cyan-500/30 rounded-lg flex items-center justify-center">
                <LuSwords className="w-5 h-5 text-cyan-400" />
              </div>
              <span className="text-zinc-500 text-sm font-medium uppercase tracking-wide">
                Parties
              </span>
            </div>
            <p className="text-3xl font-black text-white">
              {profile.stats.totalGames}
            </p>
          </div>

          {/* Ratio */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-yellow-500/30 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-yellow-950/50 border border-yellow-500/30 rounded-lg flex items-center justify-center">
                <LuPercent className="w-5 h-5 text-yellow-400" />
              </div>
              <span className="text-zinc-500 text-sm font-medium uppercase tracking-wide">
                Win Rate
              </span>
            </div>
            <p className="text-3xl font-black text-white">
              {profile.stats.winRatio}%
            </p>
          </div>
        </div>

        {/* Historique des parties */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-zinc-800 border border-zinc-700 rounded-lg flex items-center justify-center">
              <LuHistory className="w-5 h-5 text-zinc-400" />
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">
              Historique des parties
            </h2>
          </div>

          {profile.recentGames.length === 0 ? (
            <div className="text-center py-12">
              <LuTarget className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500">
                Aucune partie jouée pour le moment
              </p>
              <p className="text-zinc-600 text-sm mt-1">
                Lancez-vous dans l&apos;arène !
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {profile.recentGames.map((game) => (
                <div
                  key={game.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                    game.result === "win"
                      ? "bg-green-950/20 border-green-500/20 hover:border-green-500/40"
                      : "bg-red-950/20 border-red-500/20 hover:border-red-500/40"
                  }`}
                >
                  {/* Résultat */}
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      game.result === "win"
                        ? "bg-green-950/50 border border-green-500/30"
                        : "bg-red-950/50 border border-red-500/30"
                    }`}
                  >
                    {game.result === "win" ? (
                      <LuCrown className="w-6 h-6 text-green-400" />
                    ) : (
                      <LuSkull className="w-6 h-6 text-red-400" />
                    )}
                  </div>

                  {/* Infos partie */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-bold uppercase ${
                          game.result === "win"
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {game.result === "win" ? "Victoire" : "Défaite"}
                      </span>
                      <span className="text-zinc-600">vs</span>
                      <span className="text-white font-medium truncate">
                        {game.opponent
                          ? `${game.opponent.firstname} ${game.opponent.lastname}`
                          : "Joueur inconnu"}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <LuClock className="w-3 h-3" />
                        {formatDuration(game.duration)}
                      </span>
                      <span>
                        {game.finishedAt && formatDate(game.finishedAt)}
                      </span>
                    </div>
                  </div>

                  {/* Room ID (optionnel) */}
                  <div className="hidden sm:block px-3 py-1.5 bg-zinc-800 rounded border border-zinc-700">
                    <span className="text-xs text-zinc-400 font-mono">
                      #{game.roomId.slice(0, 8)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
