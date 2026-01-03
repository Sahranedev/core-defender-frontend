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
    redirect("/dashboard");
  }

  // Détermine si l'utilisateur actuel est le créateur (player1)
  const isCreator = gameResult.data.player1Id === userId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <GameCanvas roomId={roomId} userId={userId} isCreator={isCreator} />
    </div>
  );
}
