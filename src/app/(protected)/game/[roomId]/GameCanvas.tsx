"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

interface GameCanvasProps {
  roomId: string;
  userId: number;
}

// Types pour l'état du jeu (correspondant au backend)
interface Player {
  id: number;
  resources: number;
  coreHP: number;
  corePosition: { x: number; y: number };
}

interface Defense {
  id: string;
  type: string;
  playerId: number;
  x: number;
  y: number;
  hp: number;
}

interface Projectile {
  id: string;
  type: string;
  playerId: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
}

interface GameState {
  players: Player[];
  defenses: Defense[];
  projectiles: Projectile[];
  status: string;
}

export default function GameCanvas({ roomId, userId }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isWaitingForPlayer, setIsWaitingForPlayer] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedDefense, setSelectedDefense] = useState<string>("WALL");
  const [selectedProjectile, setSelectedProjectile] = useState<string>("BASIC");

  // Configuration du Canvas (correspond aux templates backend)
  const BOARD_WIDTH = 800;
  const BOARD_HEIGHT = 600;

  // ============================================
  // PARTIE 1 : CONNEXION WEBSOCKET
  // ============================================
  useEffect(() => {
    // Connexion au serveur WebSocket
    const socket = io("http://localhost:5000");
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Connecté au serveur WebSocket");
      console.log("🔍 RoomId:", roomId, "UserId:", userId); // ← AJOUTEZ CETTE LIGNE
      setIsConnected(true);

      socket.emit("game:createRoom", { roomId, userId });
    });
    // Événement : Réception des templates (stats des éléments)
    socket.on("game:templates", (templates) => {
      console.log("📦 Templates reçus:", templates);
    });

    // Événement : La partie démarre (2ème joueur a rejoint)
    socket.on("game:start", (data) => {
      console.log("🎮 La partie commence!", data);
      setIsWaitingForPlayer(false);
      setGameStarted(true);
    });

    // Événement : Mise à jour de l'état du jeu (60 fois par seconde)
    socket.on("game:stateUpdate", (state: GameState) => {
      setGameState(state);
    });

    // Événement : Fin de partie
    socket.on("game:end", (data) => {
      console.log("🏆 Partie terminée!", data);
      alert(`Partie terminée ! Gagnant : Player ${data.winnerId}`);
    });

    // Événement : Erreur
    socket.on("game:error", (error) => {
      console.error("❌ Erreur:", error);
      alert(error.message);
    });

    // Nettoyage à la déconnexion
    return () => {
      socket.disconnect();
    };
  }, [roomId, userId]);

  // ============================================
  // PARTIE 2 : RENDU CANVAS (60 FPS)
  // ============================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameState) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fonction de rendu appelée à chaque frame
    const render = () => {
      // 1. Effacer le canvas
      ctx.fillStyle = "#1e293b"; // Fond bleu sombre
      ctx.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);

      // 2. Dessiner une grille (optionnel, pour le style)
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 1;
      for (let x = 0; x < BOARD_WIDTH; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, BOARD_HEIGHT);
        ctx.stroke();
      }
      for (let y = 0; y < BOARD_HEIGHT; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(BOARD_WIDTH, y);
        ctx.stroke();
      }

      // 3. Dessiner les Bloc-Noyaux (cores) des joueurs
      gameState.players.forEach((player) => {
        const isMe = player.id === userId;
        ctx.fillStyle = isMe ? "#3b82f6" : "#ef4444"; // Bleu pour nous, Rouge pour adversaire
        ctx.fillRect(
          player.corePosition.x - 30,
          player.corePosition.y - 30,
          60,
          60
        );

        // Bordure
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.strokeRect(
          player.corePosition.x - 30,
          player.corePosition.y - 30,
          60,
          60
        );

        // Afficher les HP au-dessus
        ctx.fillStyle = "#ffffff";
        ctx.font = "14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(
          `HP: ${player.coreHP}`,
          player.corePosition.x,
          player.corePosition.y - 40
        );
      });

      // 4. Dessiner les défenses (murs, tourelles, etc.)
      gameState.defenses.forEach((defense) => {
        const isMyDefense = defense.playerId === userId;
        ctx.fillStyle = isMyDefense ? "#22c55e" : "#f59e0b"; // Vert pour nous, Orange pour adversaire
        ctx.fillRect(defense.x - 20, defense.y - 20, 40, 40);

        // Bordure
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.strokeRect(defense.x - 20, defense.y - 20, 40, 40);

        // HP
        ctx.fillStyle = "#ffffff";
        ctx.font = "10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`${defense.hp}`, defense.x, defense.y + 5);
      });

      // 5. Dessiner les projectiles
      gameState.projectiles.forEach((projectile) => {
        ctx.fillStyle = "#fbbf24"; // Jaune pour les projectiles
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, 5, 0, Math.PI * 2);
        ctx.fill();

        // Traînée (effet visuel)
        ctx.strokeStyle = "rgba(251, 191, 36, 0.3)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(projectile.x, projectile.y);
        ctx.lineTo(
          projectile.x - (projectile.targetX - projectile.x) * 0.05,
          projectile.y - (projectile.targetY - projectile.y) * 0.05
        );
        ctx.stroke();
      });
    };

    // Lancer le rendu en boucle (requestAnimationFrame = 60 FPS)
    let animationId: number;
    const animate = () => {
      render();
      animationId = requestAnimationFrame(animate);
    };
    animate();

    // Nettoyage
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [gameState, userId]);

  // ============================================
  // PARTIE 3 : INTERACTIONS UTILISATEUR
  // ============================================

  // Placer une défense au clic sur le canvas
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!socketRef.current || !gameStarted) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    console.log(`📍 Clic à (${x}, ${y}) - Placement de ${selectedDefense}`);

    socketRef.current.emit("game:placeDefense", {
      roomId,
      defenseType: selectedDefense,
      x,
      y,
      playerId: userId,
    });
  };

  // Lancer un projectile
  const handleLaunchProjectile = () => {
    if (!socketRef.current || !gameStarted || !gameState) return;

    // Trouver l'adversaire
    const opponent = gameState.players.find((p) => p.id !== userId);
    if (!opponent) return;

    console.log(`🚀 Lancement de ${selectedProjectile}`);

    socketRef.current.emit("game:launchProjectile", {
      roomId,
      projectileType: selectedProjectile,
      playerId: userId,
      targetPlayerId: opponent.id,
    });
  };

  // ============================================
  // PARTIE 4 : INTERFACE UTILISATEUR
  // ============================================

  // État : En attente d'un adversaire
  if (isWaitingForPlayer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            En attente d'un adversaire...
          </h2>
          <p className="text-slate-400">
            Room: <span className="text-blue-400">{roomId}</span>
          </p>
          <div className="mt-4">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  // État : Partie en cours
  const myPlayer = gameState?.players.find((p) => p.id === userId);

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">
              🎮 Partie en cours
            </h1>
            <p className="text-slate-400 text-sm">Room: {roomId}</p>
          </div>

          {/* Stats du joueur */}
          {myPlayer && (
            <div className="bg-slate-800 rounded-lg px-6 py-3 border border-slate-700">
              <div className="flex gap-6">
                <div>
                  <p className="text-slate-400 text-sm">HP</p>
                  <p className="text-2xl font-bold text-red-400">
                    {myPlayer.coreHP}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Ressources</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {myPlayer.resources}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-[1fr_300px] gap-6">
          {/* Canvas de jeu */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <canvas
              ref={canvasRef}
              width={BOARD_WIDTH}
              height={BOARD_HEIGHT}
              onClick={handleCanvasClick}
              className="cursor-crosshair rounded-lg"
            />
          </div>

          {/* Panel de contrôles */}
          <div className="space-y-4">
            {/* Défenses */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
              <h3 className="text-white font-bold mb-3">🛡️ Défenses</h3>
              <div className="space-y-2">
                {["WALL", "TURRET", "TRAP", "HEAL_BLOCK"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedDefense(type)}
                    className={`w-full px-4 py-2 rounded-lg font-medium transition-all ${
                      selectedDefense === type
                        ? "bg-green-600 text-white"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <p className="text-slate-400 text-xs mt-3">
                Cliquez sur le canvas pour placer
              </p>
            </div>

            {/* Projectiles */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
              <h3 className="text-white font-bold mb-3">🚀 Attaques</h3>
              <div className="space-y-2 mb-3">
                {["BASIC", "FAST", "HEAVY"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedProjectile(type)}
                    className={`w-full px-4 py-2 rounded-lg font-medium transition-all ${
                      selectedProjectile === type
                        ? "bg-orange-600 text-white"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <button
                onClick={handleLaunchProjectile}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-all"
              >
                LANCER
              </button>
            </div>

            {/* Légende */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
              <h3 className="text-white font-bold mb-3">📖 Légende</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span className="text-slate-300">Votre core</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span className="text-slate-300">Core adverse</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-slate-300">Vos défenses</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-500 rounded"></div>
                  <span className="text-slate-300">Défenses adverses</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
