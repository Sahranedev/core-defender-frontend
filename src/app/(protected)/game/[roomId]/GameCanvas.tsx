"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useRouter } from "next/navigation";

interface GameCanvasProps {
  roomId: string;
  userId: number;
  isCreator: boolean;
}

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

// Configuration du jeu
const BOARD_WIDTH = 1100;
const BOARD_HEIGHT = 650;
const ZONE_PLAYER1_END = 480; // Zone joueur 1 (gauche) : 0 - 480
const ZONE_PLAYER2_START = 620; // Zone joueur 2 (droite) : 620 - 1100
// Zone neutre au milieu : 480 - 620

// Stats des défenses (pour les barres de vie)
const DEFENSE_MAX_HP: Record<string, number> = {
  WALL: 500,
  TURRET: 200,
  TRAP: 100,
  HEAL_BLOCK: 200,
};

const DEFENSE_COSTS: Record<string, number> = {
  WALL: 100,
  TURRET: 350,
  TRAP: 150,
  HEAL_BLOCK: 250,
};

const PROJECTILE_COSTS: Record<string, number> = {
  BASIC: 50,
  FAST: 75,
  HEAVY: 150,
};

export default function GameCanvas({
  roomId,
  userId,
  isCreator,
}: GameCanvasProps) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isWaitingForPlayer, setIsWaitingForPlayer] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedDefense, setSelectedDefense] = useState<string>("WALL");
  const [selectedProjectile, setSelectedProjectile] = useState<string>("BASIC");
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(
    null
  );

  // Vue miroir : le joueur 2 (non-créateur) voit le terrain inversé
  // Ainsi, chaque joueur voit toujours SA zone à gauche
  const isMirrored = !isCreator;

  // Transforme une coordonnée X pour l'affichage (miroir si nécessaire)
  const toDisplayX = useCallback(
    (x: number): number => {
      return isMirrored ? BOARD_WIDTH - x : x;
    },
    [isMirrored]
  );

  // Transforme une coordonnée X d'affichage vers coordonnée serveur
  const toServerX = useCallback(
    (displayX: number): number => {
      return isMirrored ? BOARD_WIDTH - displayX : displayX;
    },
    [isMirrored]
  );

  // Détermine si une position (en coordonnées DISPLAY) est dans la zone de placement
  // En vue miroir, "ma zone" est toujours visuellement à gauche (0 à ZONE_PLAYER1_END)
  const isInMyZone = useCallback((displayX: number): boolean => {
    // En vue normale ou miroir, ma zone est toujours affichée à gauche
    return displayX <= ZONE_PLAYER1_END;
  }, []);

  // ============================================
  // PARTIE 1 : CONNEXION WEBSOCKET
  // ============================================
  useEffect(() => {
    // Connexion au serveur WebSocket
    const socket = io("http://localhost:5000");
    socketRef.current = socket;

    socket.on("connect", () => {
      // Si l'utilisateur est le créateur, il crée la room
      // Sinon, il rejoint la room existante
      if (isCreator) {
        console.log("🎮 Création de la room...");
        socket.emit("game:createRoom", { roomId, userId });
      } else {
        console.log("🎮 Rejoindre la room...");
        socket.emit("game:joinRoom", { roomId, userId });
      }
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
      setTimeout(() => router.push("/dashboard"), 2000);
    });

    // Événement : Un joueur s'est déconnecté
    socket.on(
      "game:playerDisconnected",
      (data: { userId: number; message: string }) => {
        console.log("⚠️ Joueur déconnecté:", data);
        alert(data.message);
      }
    );

    // Événement : Un joueur s'est reconnecté
    socket.on(
      "game:playerReconnected",
      (data: { userId: number; message: string }) => {
        console.log("✅ Joueur reconnecté:", data);
        alert(data.message);
      }
    );

    // Événement : Partie abandonnée (déconnexion > 10s)
    socket.on(
      "game:abandoned",
      (data: { reason: string; winnerId: number; loserId: number }) => {
        console.log("❌ Partie abandonnée:", data);

        const message =
          data.winnerId === userId
            ? `Victoire ! L'adversaire a abandonné la partie.`
            : `Défaite. Vous avez été déconnecté trop longtemps.`;

        alert(message);

        // Redirection vers le dashboard après 2 secondes
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      }
    );

    // Événement : Erreur
    socket.on("game:error", (error) => {
      console.error("❌ Erreur:", error);
      alert(error.message);
    });

    // Nettoyage à la déconnexion
    return () => {
      socket.disconnect();
    };
  }, [roomId, userId, isCreator, router]);

  // ============================================
  // PARTIE 2 : RENDU CANVAS (60 FPS)
  // ============================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameState) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      // ========== FOND ==========
      const bgGradient = ctx.createLinearGradient(0, 0, BOARD_WIDTH, 0);
      bgGradient.addColorStop(0, "#0f172a");
      bgGradient.addColorStop(0.5, "#1e293b");
      bgGradient.addColorStop(1, "#0f172a");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);

      // ========== ZONES DE PLACEMENT (en vue miroir, tout est inversé visuellement) ==========
      // Ma zone est TOUJOURS à gauche (bleue), zone adverse à droite (rouge)

      // Ma zone (gauche - bleue)
      ctx.fillStyle = "rgba(59, 130, 246, 0.15)";
      ctx.fillRect(0, 0, ZONE_PLAYER1_END, BOARD_HEIGHT);

      // Zone adverse (droite - rouge)
      ctx.fillStyle = "rgba(239, 68, 68, 0.08)";
      ctx.fillRect(
        ZONE_PLAYER2_START,
        0,
        BOARD_WIDTH - ZONE_PLAYER2_START,
        BOARD_HEIGHT
      );

      // Zone neutre (milieu - sombre)
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.fillRect(
        ZONE_PLAYER1_END,
        0,
        ZONE_PLAYER2_START - ZONE_PLAYER1_END,
        BOARD_HEIGHT
      );

      // Lignes de séparation
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 10]);
      ctx.beginPath();
      ctx.moveTo(ZONE_PLAYER1_END, 0);
      ctx.lineTo(ZONE_PLAYER1_END, BOARD_HEIGHT);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ZONE_PLAYER2_START, 0);
      ctx.lineTo(ZONE_PLAYER2_START, BOARD_HEIGHT);
      ctx.stroke();
      ctx.setLineDash([]);

      // ========== GRILLE SUBTILE ==========
      ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
      ctx.lineWidth = 1;
      for (let gx = 0; gx < BOARD_WIDTH; gx += 40) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, BOARD_HEIGHT);
        ctx.stroke();
      }
      for (let gy = 0; gy < BOARD_HEIGHT; gy += 40) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(BOARD_WIDTH, gy);
        ctx.stroke();
      }

      // ========== CORES (avec transformation miroir) ==========
      gameState.players.forEach((player) => {
        const isMe = player.id === userId;
        // Appliquer la transformation miroir sur X
        const x = toDisplayX(player.corePosition.x);
        const y = player.corePosition.y;
        const size = 60;

        // Aura/glow autour du core
        const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, size);
        glowGradient.addColorStop(
          0,
          isMe ? "rgba(59, 130, 246, 0.4)" : "rgba(239, 68, 68, 0.4)"
        );
        glowGradient.addColorStop(1, "transparent");
        ctx.fillStyle = glowGradient;
        ctx.fillRect(x - size, y - size, size * 2, size * 2);

        // Core principal
        const coreGradient = ctx.createLinearGradient(
          x - 30,
          y - 30,
          x + 30,
          y + 30
        );
        if (isMe) {
          coreGradient.addColorStop(0, "#3b82f6");
          coreGradient.addColorStop(1, "#1d4ed8");
        } else {
          coreGradient.addColorStop(0, "#ef4444");
          coreGradient.addColorStop(1, "#b91c1c");
        }
        ctx.fillStyle = coreGradient;
        ctx.fillRect(x - 30, y - 30, 60, 60);

        // Bordure du core
        ctx.strokeStyle = isMe ? "#60a5fa" : "#f87171";
        ctx.lineWidth = 3;
        ctx.strokeRect(x - 30, y - 30, 60, 60);

        // Icône au centre
        ctx.fillStyle = "#ffffff";
        ctx.font = "24px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("⚡", x, y);

        // Barre de HP sous le core
        const hpPercent = player.coreHP / 1000;
        const hpBarWidth = 70;
        const hpBarHeight = 8;
        const hpBarX = x - hpBarWidth / 2;
        const hpBarY = y + 40;

        // Fond de la barre
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(hpBarX - 2, hpBarY - 2, hpBarWidth + 4, hpBarHeight + 4);
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);

        // Barre de vie
        const hpColor =
          hpPercent > 0.5
            ? "#22c55e"
            : hpPercent > 0.25
            ? "#f59e0b"
            : "#ef4444";
        ctx.fillStyle = hpColor;
        ctx.fillRect(hpBarX, hpBarY, hpBarWidth * hpPercent, hpBarHeight);

        // Texte HP
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 12px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(`${player.coreHP} HP`, x, hpBarY + hpBarHeight + 4);
      });

      // ========== DÉFENSES (avec transformation miroir) ==========
      gameState.defenses.forEach((defense) => {
        const isMyDefense = defense.playerId === userId;
        // Appliquer la transformation miroir sur X
        const x = toDisplayX(defense.x);
        const y = defense.y;
        const size = 36;

        // Couleurs selon le type
        let primaryColor: string;
        let secondaryColor: string;
        let icon: string;

        switch (defense.type) {
          case "WALL":
            primaryColor = "#475569";
            secondaryColor = "#64748b";
            icon = "🧱";
            break;
          case "TURRET":
            primaryColor = "#dc2626";
            secondaryColor = "#ef4444";
            icon = "🔫";
            break;
          case "TRAP":
            primaryColor = "#7c3aed";
            secondaryColor = "#a855f7";
            icon = "⚡";
            break;
          case "HEAL_BLOCK":
            primaryColor = "#16a34a";
            secondaryColor = "#22c55e";
            icon = "💚";
            break;
          default:
            primaryColor = "#6b7280";
            secondaryColor = "#9ca3af";
            icon = "?";
        }

        // Ombre
        ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
        ctx.fillRect(x - size / 2 + 3, y - size / 2 + 3, size, size);

        // Défense principale
        const defGradient = ctx.createLinearGradient(
          x - size / 2,
          y - size / 2,
          x + size / 2,
          y + size / 2
        );
        defGradient.addColorStop(0, secondaryColor);
        defGradient.addColorStop(1, primaryColor);
        ctx.fillStyle = defGradient;
        ctx.fillRect(x - size / 2, y - size / 2, size, size);

        // Bordure (couleur selon propriétaire)
        ctx.strokeStyle = isMyDefense ? "#60a5fa" : "#f87171";
        ctx.lineWidth = 2;
        ctx.strokeRect(x - size / 2, y - size / 2, size, size);

        // Icône
        ctx.fillStyle = "#ffffff";
        ctx.font = "16px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(icon, x, y);

        // Barre de vie
        const maxHP = DEFENSE_MAX_HP[defense.type] || 200;
        const hpPercent = defense.hp / maxHP;
        const hpBarWidth = size;
        const hpBarHeight = 4;
        const hpBarX = x - size / 2;
        const hpBarY = y - size / 2 - 8;

        ctx.fillStyle = "#1e293b";
        ctx.fillRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);

        const hpColor =
          hpPercent > 0.5
            ? "#22c55e"
            : hpPercent > 0.25
            ? "#f59e0b"
            : "#ef4444";
        ctx.fillStyle = hpColor;
        ctx.fillRect(hpBarX, hpBarY, hpBarWidth * hpPercent, hpBarHeight);
      });

      // ========== PROJECTILES (avec transformation miroir) ==========
      gameState.projectiles.forEach((projectile) => {
        // Appliquer la transformation miroir sur X
        const x = toDisplayX(projectile.x);
        const y = projectile.y;
        const targetX = toDisplayX(projectile.targetX);

        // Traînée (avec protection contre division par zéro)
        const trailLength = 20;
        const dx = targetX - x;
        const dy = projectile.targetY - y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Éviter la division par zéro si le projectile est à sa cible
        if (dist > 0.1) {
          const trailX = x - (dx / dist) * trailLength;
          const trailY = y - (dy / dist) * trailLength;

          const trailGradient = ctx.createLinearGradient(trailX, trailY, x, y);
          trailGradient.addColorStop(0, "transparent");
          trailGradient.addColorStop(1, "#fbbf24");
          ctx.strokeStyle = trailGradient;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(trailX, trailY);
          ctx.lineTo(x, y);
          ctx.stroke();
        }

        // Projectile (glow)
        const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, 12);
        glowGradient.addColorStop(0, "#fbbf24");
        glowGradient.addColorStop(0.5, "rgba(251, 191, 36, 0.5)");
        glowGradient.addColorStop(1, "transparent");
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fill();

        // Projectile (centre)
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // ========== PREVIEW DE PLACEMENT ==========
      if (mousePos && gameStarted) {
        const canPlace = isInMyZone(mousePos.x);
        ctx.strokeStyle = canPlace
          ? "rgba(34, 197, 94, 0.8)"
          : "rgba(239, 68, 68, 0.8)";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(mousePos.x - 18, mousePos.y - 18, 36, 36);
        ctx.setLineDash([]);

        if (!canPlace) {
          ctx.fillStyle = "rgba(239, 68, 68, 0.2)";
          ctx.fillRect(mousePos.x - 18, mousePos.y - 18, 36, 36);
        }
      }

      // ========== LABELS DES ZONES ==========
      // En vue miroir, les labels sont inversés visuellement mais logiquement corrects :
      // - Ma zone est TOUJOURS affichée à gauche
      // - Zone adverse TOUJOURS à droite
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText("VOTRE ZONE", ZONE_PLAYER1_END / 2, 10);
      ctx.fillText(
        "ZONE NEUTRE",
        (ZONE_PLAYER1_END + ZONE_PLAYER2_START) / 2,
        10
      );
      ctx.fillText("ZONE ADVERSE", (ZONE_PLAYER2_START + BOARD_WIDTH) / 2, 10);
    };

    let animationId: number;
    const animate = () => {
      render();
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [gameState, userId, mousePos, gameStarted, isInMyZone, toDisplayX]);

  // ============================================
  // PARTIE 3 : INTERACTIONS UTILISATEUR
  // ============================================

  // Gestion du survol pour le preview
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = BOARD_WIDTH / rect.width;
    const scaleY = BOARD_HEIGHT / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos(null);
  };

  // Placer une défense au clic sur le canvas
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!socketRef.current || !gameStarted) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = BOARD_WIDTH / rect.width;
    const scaleY = BOARD_HEIGHT / rect.height;

    // Coordonnées en espace DISPLAY (ce que le joueur voit)
    const displayX = (e.clientX - rect.left) * scaleX;
    const displayY = (e.clientY - rect.top) * scaleY;

    // Validation côté frontend : vérifie si on peut placer dans MA zone (toujours à gauche visuellement)
    if (!isInMyZone(displayX)) {
      return; // Ne pas envoyer la requête si zone interdite
    }

    // Convertir en coordonnées SERVEUR (inverser si vue miroir)
    const serverX = toServerX(displayX);
    const serverY = displayY;

    socketRef.current.emit("game:placeDefense", {
      roomId,
      defenseType: selectedDefense,
      x: serverX,
      y: serverY,
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
            En attente d&apos;un adversaire...
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
    <div className="p-4 lg:p-6">
      <div className="max-w-[1500px] mx-auto">
        {/* Header compact */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              🎮 Partie en cours
            </h1>
            <p className="text-slate-500 text-xs">Room: {roomId.slice(-12)}</p>
          </div>

          {/* Stats du joueur */}
          {myPlayer && (
            <div className="bg-slate-800/80 backdrop-blur rounded-lg px-4 py-2 border border-slate-700 flex gap-4">
              <div className="text-center">
                <p className="text-slate-500 text-xs">HP</p>
                <p className="text-xl font-bold text-red-400">
                  {myPlayer.coreHP}
                </p>
              </div>
              <div className="w-px bg-slate-700" />
              <div className="text-center">
                <p className="text-slate-500 text-xs">Ressources</p>
                <p className="text-xl font-bold text-yellow-400">
                  {myPlayer.resources}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-[1fr_260px] gap-4">
          {/* Canvas de jeu */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-3">
            <canvas
              ref={canvasRef}
              width={BOARD_WIDTH}
              height={BOARD_HEIGHT}
              onClick={handleCanvasClick}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="cursor-crosshair rounded-lg w-full"
            />
          </div>

          {/* Panel de contrôles */}
          <div className="space-y-4">
            {/* Défenses */}
            <div className="bg-slate-800/80 backdrop-blur rounded-xl border border-slate-700 p-4">
              <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                <span className="text-xl">🛡️</span> Défenses
              </h3>
              <div className="space-y-2">
                {[
                  { type: "WALL", icon: "🧱", name: "Mur", hp: 500 },
                  { type: "TURRET", icon: "🔫", name: "Tourelle", hp: 200 },
                ].map((defense) => {
                  const cost = DEFENSE_COSTS[defense.type];
                  const canAfford = (myPlayer?.resources || 0) >= cost;
                  return (
                    <button
                      key={defense.type}
                      onClick={() => setSelectedDefense(defense.type)}
                      disabled={!canAfford}
                      className={`w-full px-3 py-2 rounded-lg font-medium transition-all flex items-center justify-between ${
                        selectedDefense === defense.type
                          ? "bg-blue-600 text-white ring-2 ring-blue-400"
                          : canAfford
                          ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                          : "bg-slate-800 text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{defense.icon}</span>
                        <span>{defense.name}</span>
                      </span>
                      <span
                        className={`text-sm ${
                          canAfford ? "text-yellow-400" : "text-red-400"
                        }`}
                      >
                        {cost} 💰
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-slate-500 text-xs mt-3 text-center">
                Cliquez dans votre zone pour placer
              </p>
            </div>

            {/* Projectiles */}
            <div className="bg-slate-800/80 backdrop-blur rounded-xl border border-slate-700 p-4">
              <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                <span className="text-xl">🚀</span> Attaques
              </h3>
              <div className="space-y-2 mb-3">
                {[
                  { type: "BASIC", name: "Basique", dmg: 50, speed: "Normal" },
                  { type: "FAST", name: "Rapide", dmg: 30, speed: "Rapide" },
                  { type: "HEAVY", name: "Lourd", dmg: 100, speed: "Lent" },
                ].map((proj) => {
                  const cost = PROJECTILE_COSTS[proj.type];
                  const canAfford = (myPlayer?.resources || 0) >= cost;
                  return (
                    <button
                      key={proj.type}
                      onClick={() => setSelectedProjectile(proj.type)}
                      disabled={!canAfford}
                      className={`w-full px-3 py-2 rounded-lg font-medium transition-all flex items-center justify-between ${
                        selectedProjectile === proj.type
                          ? "bg-orange-600 text-white ring-2 ring-orange-400"
                          : canAfford
                          ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                          : "bg-slate-800 text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      <span className="flex flex-col items-start">
                        <span>{proj.name}</span>
                        <span className="text-xs text-slate-400">
                          {proj.dmg} dmg • {proj.speed}
                        </span>
                      </span>
                      <span
                        className={`text-sm ${
                          canAfford ? "text-yellow-400" : "text-red-400"
                        }`}
                      >
                        {cost} 💰
                      </span>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={handleLaunchProjectile}
                disabled={
                  (myPlayer?.resources || 0) <
                  PROJECTILE_COSTS[selectedProjectile]
                }
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-all shadow-lg"
              >
                🎯 TIRER
              </button>
            </div>

            {/* Info zones */}
            <div className="bg-slate-800/80 backdrop-blur rounded-xl border border-slate-700 p-4">
              <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                <span className="text-xl">📍</span> Zones
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500/30 border border-blue-500 rounded"></div>
                  <span className="text-slate-300">Votre zone (gauche)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-black/30 border border-slate-500 rounded"></div>
                  <span className="text-slate-300">Zone neutre</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500/30 border border-red-500 rounded"></div>
                  <span className="text-slate-300">Zone adverse (droite)</span>
                </div>
              </div>
              {isMirrored && (
                <p className="text-xs text-slate-500 mt-2 italic">
                  Vue miroir active
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
