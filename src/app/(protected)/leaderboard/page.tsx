import {
  getTopPlayersByWins,
  getTopPlayersByWinRatio,
  getTopPlayersByGamesPlayed,
} from "@/app/actions/stats";
import {
  LuTrophy,
  LuPercent,
  LuSwords,
  LuCrown,
  LuMedal,
  LuAward,
} from "react-icons/lu";

interface PlayerStats {
  userId: number;
  firstname: string;
  lastname: string;
  wins: number;
  totalGames: number;
  winRatio: number;
}

function getRankStyle(rank: number) {
  switch (rank) {
    case 1:
      return {
        bg: "bg-yellow-950/30",
        border: "border-yellow-500/40",
        text: "text-yellow-400",
        icon: LuCrown,
      };
    case 2:
      return {
        bg: "bg-zinc-700/30",
        border: "border-zinc-400/40",
        text: "text-zinc-300",
        icon: LuMedal,
      };
    case 3:
      return {
        bg: "bg-amber-950/30",
        border: "border-amber-600/40",
        text: "text-amber-500",
        icon: LuAward,
      };
    default:
      return {
        bg: "bg-zinc-900/50",
        border: "border-zinc-800",
        text: "text-zinc-500",
        icon: null,
      };
  }
}

function LeaderboardCard({
  title,
  icon: Icon,
  iconColor,
  players,
  valueKey,
  formatValue,
  error,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  players: PlayerStats[];
  valueKey: "wins" | "winRatio" | "totalGames";
  formatValue: (value: number) => string;
  error?: string;
}) {
  if (error) {
    return (
      <div className="bg-red-950/30 border border-red-500/30 rounded-xl p-6">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Header de la carte */}
      <div className="p-5 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconColor}`}
          >
            <Icon className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-black text-white uppercase tracking-tight">
            {title}
          </h3>
        </div>
      </div>

      {/* Liste des joueurs */}
      <div className="divide-y divide-zinc-800/50">
        {players.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-zinc-500 text-sm">Aucun joueur</p>
          </div>
        ) : (
          players.slice(0, 10).map((player, index) => {
            const rank = index + 1;
            const style = getRankStyle(rank);
            const RankIcon = style.icon;

            return (
              <div
                key={player.userId}
                className={`flex items-center gap-4 p-4 ${style.bg} hover:bg-zinc-800/30 transition-colors`}
              >
                {/* Rang */}
                <div
                  className={`w-10 h-10 rounded-lg border flex items-center justify-center ${style.border} ${style.bg}`}
                >
                  {RankIcon ? (
                    <RankIcon className={`w-5 h-5 ${style.text}`} />
                  ) : (
                    <span className={`font-bold text-sm ${style.text}`}>
                      {rank}
                    </span>
                  )}
                </div>

                {/* Joueur */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">
                    {player.firstname} {player.lastname}
                  </p>
                  <p className="text-zinc-500 text-xs">
                    {player.totalGames} parties · {player.winRatio}% ratio
                  </p>
                </div>

                {/* Valeur principale */}
                <div className="text-right">
                  <p className="text-cyan-400 font-bold text-lg">
                    {formatValue(player[valueKey])}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default async function LeaderboardPage() {
  const [winsResult, ratioResult, gamesResult] = await Promise.all([
    getTopPlayersByWins(10),
    getTopPlayersByWinRatio(10, 3),
    getTopPlayersByGamesPlayed(10),
  ]);

  const winsPlayers = winsResult.success ? winsResult.data : [];
  const ratioPlayers = ratioResult.success ? ratioResult.data : [];
  const gamesPlayers = gamesResult.success ? gamesResult.data : [];

  return (
    <div className="min-h-screen bg-zinc-950 p-6 sm:p-8">
      {/* Grid pattern background */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none"></div>

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 bg-zinc-900 border-2 border-cyan-500/30 rounded-xl flex items-center justify-center">
              <LuTrophy className="w-7 h-7 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-4xl sm:text-5xl font-black text-white uppercase tracking-tight">
                Classements
              </h1>
              <p className="text-zinc-500 text-sm sm:text-base font-medium mt-1">
                Les meilleurs joueurs de Core Defender
              </p>
            </div>
          </div>
        </div>

        {/* Grille des classements */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <LeaderboardCard
            title="Par Victoires"
            icon={LuTrophy}
            iconColor="bg-green-950/50 border border-green-500/30 text-green-400"
            players={winsPlayers}
            valueKey="wins"
            formatValue={(v) => `${v} wins`}
            error={winsResult.error}
          />

          <LeaderboardCard
            title="Par Ratio"
            icon={LuPercent}
            iconColor="bg-yellow-950/50 border border-yellow-500/30 text-yellow-400"
            players={ratioPlayers}
            valueKey="winRatio"
            formatValue={(v) => `${v}%`}
            error={ratioResult.error}
          />

          <LeaderboardCard
            title="Par Parties"
            icon={LuSwords}
            iconColor="bg-cyan-950/50 border border-cyan-500/30 text-cyan-400"
            players={gamesPlayers}
            valueKey="totalGames"
            formatValue={(v) => `${v} games`}
            error={gamesResult.error}
          />
        </div>
      </div>
    </div>
  );
}
