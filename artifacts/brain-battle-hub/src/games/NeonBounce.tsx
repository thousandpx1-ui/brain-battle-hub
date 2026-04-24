import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";

interface NeonBounceProps {
  onGameOver: (score: number) => void;
  onScoreChange?: (score: number) => void;
}

export function NeonBounce({ onGameOver, onScoreChange }: NeonBounceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"idle" | "playing" | "gameover">("idle");
  const [currentScore, setCurrentScore] = useState(0);

  const gameRef = useRef({
    ball: { x: 160, y: 200, dx: 0, dy: 0, radius: 8, speed: 4 },
    paddle: { x: 120, y: 380, width: 80, height: 12 },
    score: 0,
    lastTime: 0,
  });

  const animationRef = useRef<number>(0);

  const initGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Start with a slight random downward angle
    const angle = (Math.random() * Math.PI / 4) - Math.PI / 8 + Math.PI; // roughly downwards
    const speed = 4;
    gameRef.current = {
      ball: {
        x: canvas.width / 2,
        y: canvas.height / 3,
        dx: Math.sin(angle) * speed,
        dy: -Math.cos(angle) * speed, // downwards
        radius: 8,
        speed: speed,
      },
      paddle: { x: canvas.width / 2 - 40, y: canvas.height - 24, width: 80, height: 12 },
      score: 0,
      lastTime: performance.now(),
    };
    setCurrentScore(0);
  }, []);

  const startGame = () => {
    initGame();
    setGameState("playing");
  };

  const handlePointerMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas || gameState !== "playing") return;

      const rect = canvas.getBoundingClientRect();
      let clientX = 0;

      if ("touches" in e) {
        clientX = e.touches[0].clientX;
      } else {
        clientX = (e as React.MouseEvent).clientX;
      }

      // Scale correctly based on actual rendered size vs internal resolution
      const scaleX = canvas.width / rect.width;
      const x = (clientX - rect.left) * scaleX;

      const paddle = gameRef.current.paddle;
      // Center the paddle on the cursor/finger, bound by canvas edges
      paddle.x = Math.max(0, Math.min(x - paddle.width / 2, canvas.width - paddle.width));
    },
    [gameState]
  );

  const update = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || gameState !== "playing") return;

    const state = gameRef.current;
    const { ball, paddle } = state;

    // Move ball
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Wall collisions (Left and Right)
    if (ball.x - ball.radius <= 0) {
      ball.x = ball.radius;
      ball.dx = Math.abs(ball.dx);
    } else if (ball.x + ball.radius >= canvas.width) {
      ball.x = canvas.width - ball.radius;
      ball.dx = -Math.abs(ball.dx);
    }

    // Wall collision (Top)
    if (ball.y - ball.radius <= 0) {
      ball.y = ball.radius;
      ball.dy = Math.abs(ball.dy);
    }

    // Paddle collision
    if (
      ball.dy > 0 && // Only bounce if moving down
      ball.y + ball.radius >= paddle.y &&
      ball.y - ball.radius <= paddle.y + paddle.height &&
      ball.x + ball.radius >= paddle.x &&
      ball.x - ball.radius <= paddle.x + paddle.width
    ) {
      // Hit!
      ball.y = paddle.y - ball.radius;

      // Calculate bounce angle based on where it hit the paddle
      const hitPosition = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2); // -1 (left edge) to 1 (right edge)
      const maxAngle = Math.PI / 3; // 60 degrees max spread
      const angle = hitPosition * maxAngle;

      // Increase speed slightly up to a max
      ball.speed = Math.min(ball.speed + 0.3, 14);

      ball.dx = Math.sin(angle) * ball.speed;
      ball.dy = -Math.cos(angle) * ball.speed;

      // Update score (+5 per hit)
      state.score += 5;

      // Optional: Difficulty progression (decrease paddle width)
      // Every 50 points, shrink paddle by 2px, down to a minimum of 40px
      paddle.width = Math.max(40, 80 - Math.floor(state.score / 50) * 2);

      setCurrentScore(state.score);
      onScoreChange?.(state.score);
    }

    // Game Over condition (Ball fell below paddle)
    if (ball.y - ball.radius > canvas.height) {
      setGameState("gameover");
      onGameOver(state.score);
    }
  }, [gameState, onGameOver, onScoreChange]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const { ball, paddle } = gameRef.current;

    // Draw Paddle
    ctx.fillStyle = "#2ed573";
    ctx.beginPath();
    ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 6);
    ctx.fill();

    // Draw Ball
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#ff4757";
    ctx.fill();

    // Glowing effect
    ctx.shadowBlur = 12;
    ctx.shadowColor = "#ff4757";
    ctx.fill();
    ctx.shadowBlur = 0; // Reset
  }, []);

  useEffect(() => {
    let lastRender = performance.now();
    const loop = (time: number) => {
      if (gameState === "playing") {
        update();
      }
      draw();
      animationRef.current = requestAnimationFrame(loop);
    };

    if (gameState === "playing" || gameState === "idle") {
      animationRef.current = requestAnimationFrame(loop);
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [gameState, update, draw]);

  // Initial setup
  useEffect(() => {
    if (gameState === "idle") {
      initGame();
      draw();
    }
  }, [gameState, initGame, draw]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full max-w-sm mx-auto select-none">
      {gameState === "idle" && (
        <div className="text-center absolute z-10 bg-white/90 dark:bg-gray-900/90 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 backdrop-blur-sm">
          <h2 className="text-3xl font-black mb-4">Neon Bounce</h2>
          <p className="text-gray-500 mb-8 text-sm max-w-[220px] mx-auto">
            Keep the glowing ball bouncing! Move the paddle to prevent it from falling.
          </p>
          <Button onClick={startGame} className="h-14 w-full rounded-2xl text-lg font-bold">
            Start Game
          </Button>
        </div>
      )}

      {gameState === "playing" && (
        <div className="w-full flex justify-center items-center mb-4 px-2">
          <div className="text-center bg-gray-100 dark:bg-gray-800 px-6 py-2 rounded-full shadow-inner">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Score</p>
            <p className="text-2xl font-black text-primary leading-none">{currentScore}</p>
          </div>
        </div>
      )}

      <div className="relative border-4 border-gray-200 dark:border-gray-800 rounded-[2rem] overflow-hidden bg-slate-900 w-full aspect-[3/4] max-w-[320px] touch-none shadow-2xl">
        <canvas
          ref={canvasRef}
          width={320}
          height={426}
          className="w-full h-full touch-none block"
          onMouseMove={handlePointerMove}
          onTouchMove={handlePointerMove}
          onTouchStart={handlePointerMove}
        />
      </div>

      {gameState === "gameover" && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-[2rem] text-center shadow-2xl border border-gray-100 dark:border-gray-800 scale-in-center">
            <h2 className="text-4xl font-black text-red-500 mb-2 drop-shadow-sm">Game Over!</h2>
            <p className="text-gray-500 mb-6 text-lg">
              Score: <span className="font-black text-gray-900 dark:text-white text-2xl">{currentScore}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
