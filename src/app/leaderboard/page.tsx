import {
  getTopPlayersByWins,
  getTopPlayersByWinRatio,
  getTopPlayersByGamesPlayed,
} from "@/app/actions/stats";
import LeaderboardTable from "@/app/components/LeaderboardTable";

export default async function LeaderboardPage() {
  const [winsResult, ratioResult, gamesResult] = await Promise.all([
    getTopPlayersByWins(20),
    getTopPlayersByWinRatio(20, 5),
    getTopPlayersByGamesPlayed(20),
  ]);

  const winsPlayers = winsResult.success ? winsResult.data : [];
  const ratioPlayers = ratioResult.success ? ratioResult.data : [];
  const gamesPlayers = gamesResult.success ? gamesResult.data : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🏆 Classements</h1>
          <p className="text-slate-400">
            Découvrez les meilleurs joueurs de Core Defender
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <LeaderboardTable
            title="🥇 Par Victoires"
            players={winsPlayers}
            primaryColumn={{
              label: "Victoires",
              valueKey: "wins",
            }}
            error={winsResult.error}
          />

          <LeaderboardTable
            title="📊 Par Ratio"
            players={ratioPlayers}
            primaryColumn={{
              label: "Ratio",
              valueKey: "winRatio",
              formatType: "percentage",
            }}
            error={ratioResult.error}
          />

          <LeaderboardTable
            title="🎮 Par Parties"
            players={gamesPlayers}
            primaryColumn={{
              label: "Parties",
              valueKey: "totalGames",
            }}
            error={gamesResult.error}
          />
        </div>
      </div>
    </div>
  );
}
