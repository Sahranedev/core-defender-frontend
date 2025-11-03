import { verifySession } from "@/app/lib/session";
import { redirect } from "next/navigation";
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <GameCanvas roomId={roomId} userId={parseInt(session.userId)} />
    </div>
  );
}
