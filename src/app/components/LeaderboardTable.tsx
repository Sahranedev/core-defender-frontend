"use client";

import { PlayerStats } from "../types/PlayerStats";

type FormatType = "number" | "percentage";

interface LeaderboardTableProps {
  title: string;
  players: PlayerStats[];
  primaryColumn: {
    label: string;
    valueKey: "wins" | "winRatio" | "totalGames";
    formatType?: FormatType;
  };
  isLoading?: boolean;
  error?: string;
}

function formatValue(value: number, formatType: FormatType = "number"): string {
  switch (formatType) {
    case "percentage":
      return `${value}%`;
    case "number":
    default:
      return String(value);
  }
}

export default function LeaderboardTable({
  title,
  players,
  primaryColumn,
  isLoading = false,
  error,
}: LeaderboardTableProps) {
  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-6">
        <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-6">
      <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
      {players.length === 0 ? (
        <p className="text-slate-400 text-center py-8">
          Aucun joueur dans ce classement
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-400 font-semibold">
                  Rang
                </th>
                <th className="text-left py-3 px-4 text-slate-400 font-semibold">
                  Joueur
                </th>
                <th className="text-right py-3 px-4 text-slate-400 font-semibold">
                  {primaryColumn.label}
                </th>
                <th className="text-right py-3 px-4 text-slate-400 font-semibold">
                  Victoires
                </th>
                <th className="text-right py-3 px-4 text-slate-400 font-semibold">
                  Parties
                </th>
                <th className="text-right py-3 px-4 text-slate-400 font-semibold">
                  Ratio
                </th>
              </tr>
            </thead>
            <tbody>
              {players.map((player, index) => {
                const primaryValue = player[primaryColumn.valueKey];
                return (
                  <tr
                    key={player.userId}
                    className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <span className="text-slate-300 font-semibold">
                        #{index + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-white font-medium">
                        {player.firstname} {player.lastname}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-blue-400 font-bold">
                        {formatValue(primaryValue, primaryColumn.formatType)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-300">
                      {player.wins}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-300">
                      {player.totalGames}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-green-400 font-semibold">
                        {player.winRatio}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
