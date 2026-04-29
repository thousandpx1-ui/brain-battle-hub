import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";

interface Point {
  x: number;
  y: number;
  time: number;
}

interface GameObject {
  id: number;
  type: "fruit" | "bomb";
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  sliced: boolean;
  sliceAngle?: number;
  rotation: number;
  vRotation: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

interface Props {
  onGameOver: (score: number) => void;
  onScoreChange: (score: number) => void;
}

const COLORS = ["#ef4444", "#eab308", "#22c55e", "#a855f7", "#f97316"]; // Red, Yellow, Green, Purple, Orange

export function FruitSlice({ onGameOver, onScoreChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);

  const objectsRef = useRef<GameObject[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const trailRef = useRef<Point[]>([]);
  const animationRef = useRef<number>();
  const lastSpawnTimeRef = useRef<number>(0);
  const spawnRateRef = useRef<number>(1500);
  const objectIdRef = useRef<number>(0);
  const livesRef = useRef(3);
  const isGameOverRef = useRef(false);

  const startGame = useCallback(() => {
    setIsPlaying(true);
    setLives(3);
    setScore(0);
    onScoreChange(0);
    objectsRef.current = [];
    particlesRef.current = [];
    trailRef.current = [];
    livesRef.current = 3;
    isGameOverRef.current = false;
    spawnRateRef.current = 1500;
    lastSpawnTimeRef.current = performance.now();
  }, [onScoreChange]);

  const endGame = useCallback(() => {
    setIsPlaying(false);
    isGameOverRef.current = true;
    onGameOver(score);
  }, [onGameOver, score]);

  const createSplash = (x: number, y: number, color: string) => {
    for (let i = 0; i < 15; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 1,
        color,
      });
    }
  };

  useEffect(() => {
    if (!isPlaying) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = canvas.width;
    let height = canvas.height;
    
    const handleResize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height;
        width = canvas.width;
        height = canvas.height;
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    const checkIntersection = (p1: Point, p2: Point, obj: GameObject) => {
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      const dot = (((obj.x - p1.x) * dx) + ((obj.y - p1.y) * dy)) / (len * len);
      
      let closestX = p1.x + dot * dx;
      let closestY = p1.y + dot * dy;

      if (dot < 0) {
        closestX = p1.x;
        closestY = p1.y;
      } else if (dot > 1) {
        closestX = p2.x;
        closestY = p2.y;
      }

      const dist = Math.hypot(obj.x - closestX, obj.y - closestY);
      return dist <= obj.radius;
    };

    const update = (time: number) => {
      if (isGameOverRef.current) return;

      ctx.clearRect(0, 0, width, height);

      // Spawn objects
      if (time - lastSpawnTimeRef.current > spawnRateRef.current) {
        const isBomb = Math.random() < 0.2; // 20% chance for bomb
        const radius = isBomb ? 25 : 30 + Math.random() * 10;
        const x = Math.random() * (width - radius * 2) + radius;
        
        const targetHeight = height * (0.6 + Math.random() * 0.3);
        const initialVy = -Math.sqrt(2 * 0.2 * targetHeight);

        objectsRef.current.push({
          id: objectIdRef.current++,
          type: isBomb ? "bomb" : "fruit",
          x,
          y: height + radius,
          vx: (width / 2 - x) * (0.015 + Math.random() * 0.01),
          vy: initialVy,
          radius,
          color: isBomb ? "#111" : COLORS[Math.floor(Math.random() * COLORS.length)],
          sliced: false,
          rotation: Math.random() * Math.PI * 2,
          vRotation: (Math.random() - 0.5) * 0.2,
        });

        lastSpawnTimeRef.current = time;
        spawnRateRef.current = Math.max(500, spawnRateRef.current - 10); // Speed up
      }

      // Physics & rendering objects
      for (let i = objectsRef.current.length - 1; i >= 0; i--) {
        const obj = objectsRef.current[i];
        
        obj.x += obj.vx;
        obj.y += obj.vy;
        obj.vy += 0.2; // Gravity
        obj.rotation += obj.vRotation;

        ctx.save();
        ctx.translate(obj.x, obj.y);
        ctx.rotate(obj.rotation);

        if (obj.sliced) {
          // Render two halves falling apart
          ctx.globalAlpha = obj.type === "bomb" ? 0 : 1;
          
          ctx.fillStyle = obj.color;
          ctx.beginPath();
          ctx.arc(0 - 10, 0, obj.radius, Math.PI / 2, Math.PI * 1.5);
          ctx.fill();
          
          ctx.beginPath();
          ctx.arc(0 + 10, 0, obj.radius, -Math.PI / 2, Math.PI / 2);
          ctx.fill();
        } else {
          ctx.fillStyle = obj.color;
          ctx.beginPath();
          ctx.arc(0, 0, obj.radius, 0, Math.PI * 2);
          ctx.fill();

          if (obj.type === "bomb") {
            ctx.fillStyle = "#ef4444";
            ctx.beginPath();
            ctx.arc(0, -obj.radius + 5, 5, 0, Math.PI * 2);
            ctx.fill();
            // Spark effect
            if (Math.random() < 0.3) {
              createSplash(obj.x + Math.sin(obj.rotation) * obj.radius, obj.y - Math.cos(obj.rotation) * obj.radius, "#fbbf24");
            }
          } else {
             // Inner lighter part for fruit
             ctx.fillStyle = "rgba(255,255,255,0.3)";
             ctx.beginPath();
             ctx.arc(0, 0, obj.radius * 0.6, 0, Math.PI * 2);
             ctx.fill();
          }
        }
        ctx.restore();

        // Check if out of bounds
        if (obj.y - obj.radius > height && obj.vy > 0) {
          if (!obj.sliced && obj.type === "fruit") {
            livesRef.current -= 1;
            setLives(livesRef.current);
            if (livesRef.current <= 0) {
              endGame();
            }
          }
          objectsRef.current.splice(i, 1);
        }
      }

      // Slice detection
      const now = performance.now();
      trailRef.current = trailRef.current.filter((p) => now - p.time < 200);

      if (trailRef.current.length > 1) {
        const p1 = trailRef.current[trailRef.current.length - 2];
        const p2 = trailRef.current[trailRef.current.length - 1];

        let combo = 0;
        objectsRef.current.forEach((obj) => {
          if (!obj.sliced && checkIntersection(p1, p2, obj)) {
            obj.sliced = true;
            if (obj.type === "bomb") {
              createSplash(obj.x, obj.y, "#ef4444");
              endGame();
            } else {
              createSplash(obj.x, obj.y, obj.color);
              obj.vx += (p2.x - p1.x) * 0.05;
              obj.vy += (p2.y - p1.y) * 0.05;
              combo++;
            }
          }
        });

        if (combo > 0 && !isGameOverRef.current) {
          setScore((s) => {
            const newScore = s + combo * 10 + (combo > 1 ? combo * 5 : 0);
            onScoreChange(newScore);
            return newScore;
          });
        }
      }

      // Render trail
      if (trailRef.current.length > 1) {
        ctx.beginPath();
        ctx.moveTo(trailRef.current[0].x, trailRef.current[0].y);
        for (let i = 1; i < trailRef.current.length; i++) {
          ctx.lineTo(trailRef.current[i].x, trailRef.current[i].y);
        }
        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
      }

      // Render particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2;
        p.life -= 0.02;

        if (p.life <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      animationRef.current = requestAnimationFrame(update);
    };

    animationRef.current = requestAnimationFrame(update);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, [isPlaying, endGame, onScoreChange]);

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPlaying) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    
    // Only track if pointer is down (touch or mouse click)
    if (e.buttons > 0 || e.pointerType === "touch") {
        trailRef.current.push({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        time: performance.now(),
        });
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPlaying) return;
    trailRef.current = []; // Reset trail on new stroke
    handlePointerMove(e);
  };

  const handlePointerUp = () => {
      // Keep trail to fade out naturally
  };

  if (!isPlaying) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Fruit Slice</h2>
          <p className="text-gray-500">Slice fruits, avoid bombs!</p>
          <div className="mt-4 flex gap-4 justify-center text-sm">
             <div className="flex items-center gap-1">
                 <span className="w-3 h-3 rounded-full bg-green-500"></span>
                 Fruit (+10)
             </div>
             <div className="flex items-center gap-1">
                 <span className="w-3 h-3 rounded-full bg-black"></span>
                 Bomb (Game Over)
             </div>
          </div>
        </div>
        <Button onClick={startGame} className="w-48 h-12 text-lg rounded-2xl">
          Start Game
        </Button>
      </div>
    );
  }

  return (
    <div className="relative w-full flex-1 h-full flex flex-col bg-slate-900 overflow-hidden shadow-inner touch-none">
      <div className="absolute top-4 left-4 z-10 flex gap-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className={`text-2xl ${i < lives ? "text-red-500" : "text-gray-600"}`}
          >
            ❤️
          </div>
        ))}
      </div>
      <div className="absolute top-4 right-4 z-10 text-white font-bold text-xl font-mono">
        {score}
      </div>
      <canvas
        ref={canvasRef}
        className="w-full flex-1 cursor-crosshair touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
    </div>
  );
}
