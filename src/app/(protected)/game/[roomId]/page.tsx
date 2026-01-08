import { verifySession } from "@/app/lib/session";
import { redirect } from "next/navigation";
import { fetchGameByRoomId } from "@/app/actions/games";
import GameCanvas from "./GameCanvas";

interface PageProps {
  params: Promise<{
    roomId: string;
  }>;
}

export default async function GamePage({ params }: PageProps) {
  // Vérifie que l'utilisateur est connecté
  const session = await verifySession();

  if (!session) {
    redirect("/login");
  }

  const { roomId } = await params;
  const userId = parseInt(session.userId);

  // Récupère les informations de la partie
  const gameResult = await fetchGameByRoomId(roomId);

  if (!gameResult.success || !gameResult.data) {
    redirect("/arene");
  }

  const game = gameResult.data;

  // Vérifie si l'utilisateur peut accéder à cette partie
  const isPlayer1 = game.player1Id === userId;
  const isPlayer2 = game.player2Id === userId;
  const isParticipant = isPlayer1 || isPlayer2;

  // Si la partie est annulée ou terminée et que l'utilisateur n'est pas participant
  if (
    (game.status === "cancelled" || game.status === "finished") &&
    !isParticipant
  ) {
    redirect("/arene");
  }

  // Si la partie est annulée, même les participants sont redirigés
  if (game.status === "cancelled") {
    redirect("/arene");
  }

  // Si la partie est en cours et que l'utilisateur n'est pas un des joueurs
  if (game.status === "playing" && !isParticipant) {
    redirect("/arene");
  }

  // Détermine si l'utilisateur actuel est le créateur (player1)
  const isCreator = isPlayer1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <GameCanvas roomId={roomId} userId={userId} isCreator={isCreator} />
    </div>
  );
}
