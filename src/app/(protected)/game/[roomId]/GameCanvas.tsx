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

// ============================================
// SYSTÈME DE NOTIFICATIONS IN-GAME
// ============================================
type NotificationType = "error" | "warning" | "success" | "info";

interface GameNotification {
  id: string;
  message: string;
  type: NotificationType;
  duration: number;
}

// ============================================
// CONFIGURATION DU JEU
// ============================================
const BOARD_WIDTH = 1100;
const BOARD_HEIGHT = 650;
const ZONE_PLAYER1_END = 480;
const ZONE_PLAYER2_START = 620;

// Stats des défenses (synchronisé avec le backend)
const DEFENSE_MAX_HP: Record<string, number> = {
  WALL: 400,
  TURRET: 150,
  TRAP: 100,
  HEAL_BLOCK: 200,
};

const DEFENSE_COSTS: Record<string, number> = {
  WALL: 150,
  TURRET: 400,
  TRAP: 200,
  HEAL_BLOCK: 300,
};

const DEFENSE_LIMITS: Record<string, number> = {
  WALL: 10,
  TURRET: 6,
  TRAP: 4,
  HEAL_BLOCK: 3,
};

const PROJECTILE_COSTS: Record<string, number> = {
  BASIC: 75,
  FAST: 100,
  HEAVY: 200,
};

// HP du core pour le calcul des barres de vie
const CORE_MAX_HP = 2500;

// ============================================
// CONFIGURATION DES SPRITES (Mix Top-Down + Isométrique)
// ============================================
const SPRITE_PATHS = {
  // Cores isométriques (avec relief)
  coreTower: "/game/core-tower.png",
  coreEnemy: "/game/core-enemy.png",
  // Défenses top-down
  turret: "/game/turret.png",
  turretEnemy: "/game/turret-enemy.png",
  wall: "/game/wall.png",
  trap: "/game/trap.png",
  healBlock: "/game/heal-block.png",
  // Projectiles
  projectileBasic: "/game/projectile.png",
  projectileFast: "/game/projectile-fast.png",
  projectileHeavy: "/game/projectile-heavy.png",
} as const;

// Mapping type de défense → clé sprite (pour mes défenses)
const DEFENSE_SPRITE_MAP: Record<string, keyof typeof SPRITE_PATHS> = {
  WALL: "wall",
  TURRET: "turret",
  TRAP: "trap",
  HEAL_BLOCK: "healBlock",
};

// Mapping type de défense → clé sprite (pour les défenses ennemies)
const DEFENSE_SPRITE_MAP_ENEMY: Record<string, keyof typeof SPRITE_PATHS> = {
  WALL: "wall",
  TURRET: "turretEnemy",
  TRAP: "trap",
  HEAL_BLOCK: "healBlock",
};

// Mapping type de projectile → clé sprite
const PROJECTILE_SPRITE_MAP: Record<string, keyof typeof SPRITE_PATHS> = {
  BASIC: "projectileBasic",
  FAST: "projectileFast",
  HEAVY: "projectileHeavy",
};

type GameImages = Record<keyof typeof SPRITE_PATHS, HTMLImageElement>;

// ============================================
// FONCTION DE PRÉCHARGEMENT DES IMAGES
// ============================================
function preloadImages(): Promise<GameImages> {
  return new Promise((resolve, reject) => {
    const images = {} as GameImages;
    const entries = Object.entries(SPRITE_PATHS);
    let loadedCount = 0;

    entries.forEach(([key, path]) => {
      const img = new Image();
      img.src = path;

      img.onload = () => {
        images[key as keyof typeof SPRITE_PATHS] = img;
        loadedCount++;

        if (loadedCount === entries.length) {
          resolve(images);
        }
      };

      img.onerror = () => {
        console.error(`Erreur de chargement: ${path}`);
        reject(new Error(`Failed to load image: ${path}`));
      };
    });
  });
}

export default function GameCanvas({
  roomId,
  userId,
  isCreator,
}: GameCanvasProps) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // État des images préchargées
  const [gameImages, setGameImages] = useState<GameImages | null>(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isWaitingForPlayer, setIsWaitingForPlayer] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedDefense, setSelectedDefense] = useState<string>("WALL");
  const [selectedProjectile, setSelectedProjectile] = useState<string>("BASIC");
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(
    null
  );

  // Système de notifications in-game
  const [notifications, setNotifications] = useState<GameNotification[]>([]);

  // Système de décompte au démarrage
  const [countdown, setCountdown] = useState<number | null>(null);
  const [countdownText, setCountdownText] = useState<string | null>(null);

  // Fonction pour afficher une notification
  const showNotification = useCallback(
    (message: string, type: NotificationType = "info", duration = 3000) => {
      const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const notification: GameNotification = { id, message, type, duration };

      setNotifications((prev) => [...prev, notification]);

      // Supprime automatiquement après la durée
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, duration);
    },
    []
  );

  // ============================================
  // PRÉCHARGEMENT DES IMAGES AU MONTAGE
  // ============================================
  useEffect(() => {
    preloadImages()
      .then((images) => {
        setGameImages(images);
        setImagesLoaded(true);
        console.log("✅ Sprites chargés avec succès");
      })
      .catch((error) => {
        console.error("❌ Erreur chargement sprites:", error);
        // On continue quand même, le jeu fonctionnera avec des fallbacks
        setImagesLoaded(true);
      });
  }, []);

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
    const socket = io(
      process.env.NEXT_PUBLIC_WS_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:5000"
    );
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

      // Lance le décompte avant le début de la partie
      setCountdown(5);
      setCountdownText(null);

      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(countdownInterval);
            setCountdownText("C'EST PARTI !");
            setTimeout(() => {
              setCountdown(null);
              setCountdownText(null);
              setGameStarted(true);
            }, 1200);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    });

    // Événement : Mise à jour de l'état du jeu (60 fois par seconde)
    socket.on("game:stateUpdate", (state: GameState) => {
      setGameState(state);
    });

    // Événement : Fin de partie
    socket.on("game:end", (data) => {
      console.log("🏆 Partie terminée!", data);
      const isWinner = data.winnerId === userId;
      showNotification(
        isWinner
          ? "🏆 Victoire ! Vous avez gagné !"
          : "💀 Défaite... Votre core a été détruit",
        isWinner ? "success" : "error",
        5000
      );
      setTimeout(() => router.push("/arene"), 3000);
    });

    // Événement : Un joueur s'est déconnecté
    socket.on(
      "game:playerDisconnected",
      (data: { userId: number; message: string }) => {
        console.log("⚠️ Joueur déconnecté:", data);
        showNotification(
          "⚠️ Adversaire déconnecté - Reconnexion en cours...",
          "warning",
          5000
        );
      }
    );

    // Événement : Un joueur s'est reconnecté
    socket.on(
      "game:playerReconnected",
      (data: { userId: number; message: string }) => {
        console.log("✅ Joueur reconnecté:", data);
        showNotification("✅ Adversaire reconnecté !", "success", 3000);
      }
    );

    // Événement : Partie abandonnée (déconnexion > 10s)
    socket.on(
      "game:abandoned",
      (data: { reason: string; winnerId: number; loserId: number }) => {
        console.log("❌ Partie abandonnée:", data);

        const isWinner = data.winnerId === userId;
        showNotification(
          isWinner
            ? "🏆 Victoire ! L'adversaire a abandonné"
            : "💀 Défaite - Déconnexion trop longue",
          isWinner ? "success" : "error",
          5000
        );

        setTimeout(() => {
          router.push("/arene");
        }, 3000);
      }
    );

    // Événement : Erreur
    socket.on("game:error", (error) => {
      console.error("❌ Erreur:", error);
      showNotification(`❌ ${error.message}`, "error", 4000);

      // Redirige vers l'arène en cas d'erreur critique
      if (
        error.message.includes("n'est plus connecté") ||
        error.message.includes("introuvable") ||
        error.message.includes("déjà commencé") ||
        error.message.includes("terminée")
      ) {
        setTimeout(() => router.push("/arene"), 2000);
      }
    });

    // Nettoyage à la déconnexion
    return () => {
      socket.disconnect();
    };
  }, [roomId, userId, isCreator, router, showNotification]);

  // ============================================
  // PARTIE 2 : RENDU CANVAS (60 FPS) AVEC SPRITES
  // ============================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameState) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      // ========== FOND ==========
      const bgGradient = ctx.createLinearGradient(0, 0, BOARD_WIDTH, 0);
      bgGradient.addColorStop(0, "#1a1a2e");
      bgGradient.addColorStop(0.5, "#16213e");
      bgGradient.addColorStop(1, "#1a1a2e");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);

      // ========== ZONES DE PLACEMENT ==========
      // Ma zone (gauche - bleue)
      ctx.fillStyle = "rgba(59, 130, 246, 0.12)";
      ctx.fillRect(0, 0, ZONE_PLAYER1_END, BOARD_HEIGHT);

      // Zone adverse (droite - rouge)
      ctx.fillStyle = "rgba(239, 68, 68, 0.08)";
      ctx.fillRect(
        ZONE_PLAYER2_START,
        0,
        BOARD_WIDTH - ZONE_PLAYER2_START,
        BOARD_HEIGHT
      );

      // Zone neutre (milieu)
      ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
      ctx.fillRect(
        ZONE_PLAYER1_END,
        0,
        ZONE_PLAYER2_START - ZONE_PLAYER1_END,
        BOARD_HEIGHT
      );

      // Lignes de séparation
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
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
      ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
      ctx.lineWidth = 1;
      for (let gx = 0; gx < BOARD_WIDTH; gx += 50) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, BOARD_HEIGHT);
        ctx.stroke();
      }
      for (let gy = 0; gy < BOARD_HEIGHT; gy += 50) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(BOARD_WIDTH, gy);
        ctx.stroke();
      }

      // ========== CORES (avec sprites isométriques) ==========
      gameState.players.forEach((player) => {
        const isMe = player.id === userId;
        const x = toDisplayX(player.corePosition.x);
        const y = player.corePosition.y;
        const coreWidth = 90;
        const coreHeight = 100; // Plus haut car isométrique

        // Aura/glow autour du core
        const glowGradient = ctx.createRadialGradient(
          x,
          y + 10,
          0,
          x,
          y + 10,
          70
        );
        glowGradient.addColorStop(
          0,
          isMe ? "rgba(59, 130, 246, 0.6)" : "rgba(239, 68, 68, 0.6)"
        );
        glowGradient.addColorStop(1, "transparent");
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(x, y + 10, 70, 0, Math.PI * 2);
        ctx.fill();

        // Ombre sous le core
        ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
        ctx.beginPath();
        ctx.ellipse(
          x,
          y + coreHeight / 2 - 5,
          coreWidth / 2.5,
          15,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();

        // Sprite du core isométrique
        const coreSprite = isMe ? gameImages?.coreTower : gameImages?.coreEnemy;
        if (coreSprite) {
          ctx.drawImage(
            coreSprite,
            x - coreWidth / 2,
            y - coreHeight / 2,
            coreWidth,
            coreHeight
          );
        } else {
          // Fallback : carré coloré
          ctx.fillStyle = isMe ? "#3b82f6" : "#ef4444";
          ctx.fillRect(x - 35, y - 35, 70, 70);
        }

        // Bordure lumineuse autour (effet glow)
        ctx.shadowColor = isMe ? "#3b82f6" : "#ef4444";
        ctx.shadowBlur = 15;
        ctx.strokeStyle = isMe ? "#60a5fa" : "#f87171";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(x, y + 15, coreWidth / 2.2, 25, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Barre de HP sous le core
        const hpPercent = player.coreHP / CORE_MAX_HP;
        const hpBarWidth = 80;
        const hpBarHeight = 10;
        const hpBarX = x - hpBarWidth / 2;
        const hpBarY = y + coreHeight / 2 + 5;

        // Fond de la barre
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.beginPath();
        ctx.roundRect(
          hpBarX - 2,
          hpBarY - 2,
          hpBarWidth + 4,
          hpBarHeight + 4,
          4
        );
        ctx.fill();

        ctx.fillStyle = "#1e293b";
        ctx.beginPath();
        ctx.roundRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight, 3);
        ctx.fill();

        // Barre de vie
        const hpColor =
          hpPercent > 0.5
            ? "#22c55e"
            : hpPercent > 0.25
            ? "#f59e0b"
            : "#ef4444";
        ctx.fillStyle = hpColor;
        ctx.beginPath();
        ctx.roundRect(hpBarX, hpBarY, hpBarWidth * hpPercent, hpBarHeight, 3);
        ctx.fill();

        // Texte HP
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 12px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(`${player.coreHP} HP`, x, hpBarY + hpBarHeight + 4);
      });

      // ========== DÉFENSES (avec sprites et rotation dynamique) ==========

      // Fonction pour calculer l'angle vers la cible d'une tourelle
      const calculateTurretAngle = (
        turretX: number,
        turretY: number,
        turretPlayerId: number
      ): number => {
        let targetX: number | null = null;
        let targetY: number | null = null;
        let minDistance = Infinity;
        const TURRET_RANGE = 950; // Même portée que le backend

        // Priorité 1 : Chercher les tourelles ennemies à portée
        for (const otherDefense of gameState.defenses) {
          if (otherDefense.type !== "TURRET") continue;
          if (otherDefense.playerId === turretPlayerId) continue;

          const enemyX = toDisplayX(otherDefense.x);
          const enemyY = otherDefense.y;
          const dx = enemyX - turretX;
          const dy = enemyY - turretY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance <= TURRET_RANGE && distance < minDistance) {
            minDistance = distance;
            targetX = enemyX;
            targetY = enemyY;
          }
        }

        // Priorité 2 : Si pas de tourelle ennemie, cibler le core ennemi
        if (targetX === null) {
          for (const player of gameState.players) {
            if (player.id === turretPlayerId) continue;

            const coreX = toDisplayX(player.corePosition.x);
            const coreY = player.corePosition.y;
            const dx = coreX - turretX;
            const dy = coreY - turretY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= TURRET_RANGE && distance < minDistance) {
              targetX = coreX;
              targetY = coreY;
            }
          }
        }

        // Calculer l'angle vers la cible
        if (targetX !== null && targetY !== null) {
          const dx = targetX - turretX;
          const dy = targetY - turretY;
          // Le sprite pointe vers le haut, donc on ajoute 90° (π/2)
          return Math.atan2(dy, dx) + Math.PI / 2;
        }

        // Par défaut : pointer vers l'ennemi (droite pour moi, gauche pour l'ennemi)
        return turretPlayerId === userId ? Math.PI / 2 : -Math.PI / 2;
      };

      gameState.defenses.forEach((defense) => {
        const isMyDefense = defense.playerId === userId;
        const x = toDisplayX(defense.x);
        const y = defense.y;
        const size = 45;

        // Ombre portée
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.beginPath();
        ctx.ellipse(x, y + size / 2, size / 2, size / 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Sprite de la défense (différent selon propriétaire pour les tourelles)
        const spriteMap = isMyDefense
          ? DEFENSE_SPRITE_MAP
          : DEFENSE_SPRITE_MAP_ENEMY;
        const spriteKey = spriteMap[defense.type];
        const sprite = spriteKey && gameImages?.[spriteKey];

        if (sprite) {
          // Rotation dynamique pour les tourelles vers leur cible
          if (defense.type === "TURRET") {
            ctx.save();
            ctx.translate(x, y);
            const angle = calculateTurretAngle(x, y, defense.playerId);
            ctx.rotate(angle);
            ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
            ctx.restore();
          } else {
            ctx.drawImage(sprite, x - size / 2, y - size / 2, size, size);
          }
        } else {
          // Fallback : forme colorée selon le type
          let color: string;
          switch (defense.type) {
            case "WALL":
              color = "#64748b";
              break;
            case "TURRET":
              color = "#ef4444";
              break;
            case "TRAP":
              color = "#a855f7";
              break;
            case "HEAL_BLOCK":
              color = "#22c55e";
              break;
            default:
              color = "#9ca3af";
          }
          ctx.fillStyle = color;
          ctx.fillRect(x - size / 2, y - size / 2, size, size);
        }

        // Barre de vie au-dessus
        const maxHP = DEFENSE_MAX_HP[defense.type] || 200;
        const hpPercent = defense.hp / maxHP;
        const hpBarWidth = size;
        const hpBarHeight = 5;
        const hpBarX = x - size / 2;
        const hpBarY = y - size / 2 - 10;

        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.beginPath();
        ctx.roundRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight, 2);
        ctx.fill();

        const hpColor =
          hpPercent > 0.5
            ? "#22c55e"
            : hpPercent > 0.25
            ? "#f59e0b"
            : "#ef4444";
        ctx.fillStyle = hpColor;
        ctx.beginPath();
        ctx.roundRect(hpBarX, hpBarY, hpBarWidth * hpPercent, hpBarHeight, 2);
        ctx.fill();
      });

      // ========== PROJECTILES (avec sprites) ==========
      gameState.projectiles.forEach((projectile) => {
        const x = toDisplayX(projectile.x);
        const y = projectile.y;
        const targetX = toDisplayX(projectile.targetX);

        // Traînée
        const trailLength = 25;
        const dx = targetX - x;
        const dy = projectile.targetY - y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0.1) {
          const trailX = x - (dx / dist) * trailLength;
          const trailY = y - (dy / dist) * trailLength;

          const trailGradient = ctx.createLinearGradient(trailX, trailY, x, y);
          trailGradient.addColorStop(0, "transparent");
          trailGradient.addColorStop(1, "rgba(251, 191, 36, 0.8)");
          ctx.strokeStyle = trailGradient;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(trailX, trailY);
          ctx.lineTo(x, y);
          ctx.stroke();
        }

        // Glow autour du projectile
        const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, 15);
        glowGradient.addColorStop(0, "rgba(251, 191, 36, 0.6)");
        glowGradient.addColorStop(1, "transparent");
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, Math.PI * 2);
        ctx.fill();

        // Sprite du projectile avec rotation vers la cible
        const spriteKey = PROJECTILE_SPRITE_MAP[projectile.type];
        const sprite = spriteKey && gameImages?.[spriteKey];
        const projSize =
          projectile.type === "HEAVY"
            ? 28
            : projectile.type === "FAST"
            ? 18
            : 22;

        if (sprite && dist > 0.1) {
          ctx.save();
          ctx.translate(x, y);
          // Calculer l'angle vers la cible (les sprites pointent vers le haut, donc +90°)
          const angle = Math.atan2(dy, dx) + Math.PI / 2;
          ctx.rotate(angle);
          ctx.drawImage(
            sprite,
            -projSize / 2,
            -projSize / 2,
            projSize,
            projSize
          );
          ctx.restore();
        } else if (sprite) {
          ctx.drawImage(
            sprite,
            x - projSize / 2,
            y - projSize / 2,
            projSize,
            projSize
          );
        } else {
          // Fallback : cercle
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(x, y, projSize / 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // ========== PREVIEW DE PLACEMENT ==========
      if (mousePos && gameStarted) {
        const canPlace = isInMyZone(mousePos.x);
        const previewSize = 45;

        // Sprite preview (semi-transparent)
        const spriteKey = DEFENSE_SPRITE_MAP[selectedDefense];
        const sprite = spriteKey && gameImages?.[spriteKey];

        ctx.globalAlpha = canPlace ? 0.7 : 0.3;

        if (sprite) {
          ctx.drawImage(
            sprite,
            mousePos.x - previewSize / 2,
            mousePos.y - previewSize / 2,
            previewSize,
            previewSize
          );
        }

        ctx.globalAlpha = 1;

        // Bordure de preview
        ctx.strokeStyle = canPlace
          ? "rgba(34, 197, 94, 0.9)"
          : "rgba(239, 68, 68, 0.9)";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(
          mousePos.x - previewSize / 2,
          mousePos.y - previewSize / 2,
          previewSize,
          previewSize
        );
        ctx.setLineDash([]);

        if (!canPlace) {
          ctx.fillStyle = "rgba(239, 68, 68, 0.2)";
          ctx.fillRect(
            mousePos.x - previewSize / 2,
            mousePos.y - previewSize / 2,
            previewSize,
            previewSize
          );
        }
      }

      // ========== LABELS DES ZONES ==========
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText("VOTRE ZONE", ZONE_PLAYER1_END / 2, 12);
      ctx.fillText(
        "ZONE NEUTRE",
        (ZONE_PLAYER1_END + ZONE_PLAYER2_START) / 2,
        12
      );
      ctx.fillText("ZONE ADVERSE", (ZONE_PLAYER2_START + BOARD_WIDTH) / 2, 12);
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
  }, [
    gameState,
    userId,
    mousePos,
    gameStarted,
    isInMyZone,
    toDisplayX,
    gameImages,
    selectedDefense,
  ]);

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

  // État : Chargement des assets
  if (!imagesLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <div className="text-6xl mb-4">🎮</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Chargement des assets...
          </h2>
          <div className="mt-4">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  // État : En attente d'un adversaire
  if (isWaitingForPlayer) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
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
    <div className="p-4 lg:p-6 relative">
      {/* ========== NOTIFICATIONS IN-GAME ========== */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`
              notification-enter
              px-6 py-3 rounded-xl shadow-2xl backdrop-blur-md
              font-semibold text-white text-center min-w-[320px]
              border-2
              ${
                notif.type === "error"
                  ? "bg-red-600/95 border-red-400 text-red-50"
                  : ""
              }
              ${
                notif.type === "warning"
                  ? "bg-amber-500/95 border-amber-300 text-amber-50"
                  : ""
              }
              ${
                notif.type === "success"
                  ? "bg-emerald-600/95 border-emerald-400 text-emerald-50"
                  : ""
              }
              ${
                notif.type === "info"
                  ? "bg-blue-600/95 border-blue-400 text-blue-50"
                  : ""
              }
            `}
          >
            {notif.message}
          </div>
        ))}
      </div>

      {/* ========== OVERLAY DÉCOMPTE ========== */}
      {(countdown !== null || countdownText !== null) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <div className="countdown-container text-center">
            {countdown !== null && (
              <div className="countdown-number" key={countdown}>
                <span className="text-[180px] font-black text-transparent bg-clip-text bg-gradient-to-b from-cyan-400 via-blue-500 to-purple-600 drop-shadow-2xl">
                  {countdown}
                </span>
                <div className="countdown-ring"></div>
              </div>
            )}
            {countdownText !== null && (
              <div className="countdown-text">
                <span className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500">
                  {countdownText}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

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
                  { type: "WALL", icon: "🧱", name: "Mur" },
                  { type: "TURRET", icon: "🔫", name: "Tourelle" },
                ].map((defense) => {
                  const cost = DEFENSE_COSTS[defense.type];
                  const limit = DEFENSE_LIMITS[defense.type];
                  const placed =
                    gameState?.defenses.filter(
                      (d) => d.type === defense.type && d.playerId === userId
                    ).length ?? 0;
                  const canAfford = (myPlayer?.resources || 0) >= cost;
                  const hasRoom = placed < limit;
                  const canPlace = canAfford && hasRoom;

                  return (
                    <button
                      key={defense.type}
                      onClick={() => setSelectedDefense(defense.type)}
                      disabled={!canPlace}
                      className={`w-full px-3 py-2 rounded-lg font-medium transition-all flex items-center justify-between ${
                        selectedDefense === defense.type
                          ? "bg-blue-600 text-white ring-2 ring-blue-400"
                          : canPlace
                          ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                          : "bg-slate-800 text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      <span className="flex flex-col items-start">
                        <span className="flex items-center gap-2">
                          <span>{defense.icon}</span>
                          <span>{defense.name}</span>
                        </span>
                        <span
                          className={`text-xs ${
                            hasRoom ? "text-slate-400" : "text-red-400"
                          }`}
                        >
                          {placed}/{limit} placés
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
