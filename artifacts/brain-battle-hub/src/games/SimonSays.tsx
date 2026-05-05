import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";

const COLORS = ["#ff4757", "#2ed573", "#1e90ff", "#ffa502"] as const;
const ACTIVE_COLORS = ["#ff6b81", "#7bed9f", "#70a1ff", "#ffbe76"] as const;

type GameState = "idle" | "showing" | "input" | "wrong" | "gameover";

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  rotation: number;
  color: string;
  delay: number;
}

export function SimonSays({
  onGameOver,
  onScoreChange,
}: {
  onGameOver: (score: number) => void;
  onScoreChange?: (score: number) => void;
}) {
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerInput, setPlayerInput] = useState<number[]>([]);
  const [level, setLevel] = useState(1);
  const [strikes, setStrikes] = useState(0);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<GameState>("idle");
  const [activeTile, setActiveTile] = useState<number | null>(null);
  const [shakeTile, setShakeTile] = useState<number | null>(null);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const sparkleIdRef = useRef(0);

  const maxStrikes = 3;
  const speedRef = useRef(700);

  const startGame = useCallback(() => {
    setSequence([]);
    setPlayerInput([]);
    setLevel(1);
    setStrikes(0);
    setScore(0);
    speedRef.current = 700;
    setGameState("idle");
    setTimeout(() => {
      generateSequence([]);
    }, 500);
  }, []);

  const generateSequence = useCallback((currentSequence: number[]) => {
    const next = Math.floor(Math.random() * 4);
    const newSequence = [...currentSequence, next];
    setSequence(newSequence);
    setPlayerInput([]);
    setGameState("showing");
    playSequence(newSequence);
  }, []);

  const playSequence = useCallback(
    (seq: number[]) => {
      let i = 0;
      const interval = setInterval(() => {
        setActiveTile(seq[i]);
        setTimeout(() => setActiveTile(null), 300);
        i++;
        if (i >= seq.length) {
          clearInterval(interval);
          setTimeout(() => {
            setGameState("input");
          }, 300);
        }
      }, speedRef.current);
    },
    []
  );

  const generateSparkles = (tileIndex: number) => {
    const tilePositions = [
      { x: 25, y: 25 }, // top-left
      { x: 75, y: 25 }, // top-right
      { x: 25, y: 75 }, // bottom-left
      { x: 75, y: 75 }, // bottom-right
    ];

    const pos = tilePositions[tileIndex];
    const color = ACTIVE_COLORS[tileIndex];
    const newSparkles: Sparkle[] = [];

    for (let i = 0; i < 8; i++) {
      sparkleIdRef.current += 1;
      newSparkles.push({
        id: sparkleIdRef.current,
        x: pos.x + (Math.random() - 0.5) * 40,
        y: pos.y + (Math.random() - 0.5) * 40,
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
        color,
        delay: Math.random() * 0.15,
      });
    }

    setSparkles((prev) => [...prev, ...newSparkles]);
    setTimeout(() => {
      setSparkles((prev) => prev.filter((s) => !newSparkles.find((ns) => ns.id === s.id)));
    }, 600);
  };

  const handleTap = useCallback(
    (index: number) => {
      if (gameState !== "input") return;

      generateSparkles(index);

      const newInput = [...playerInput, index];
      setPlayerInput(newInput);

      const currentIndex = newInput.length - 1;
      if (newInput[currentIndex] !== sequence[currentIndex]) {
        // Wrong move
        setShakeTile(index);
        setTimeout(() => setShakeTile(null), 500);
        setGameState("wrong");

        const newStrikes = strikes + 1;
        setStrikes(newStrikes);

        if (newStrikes >= maxStrikes) {
          setTimeout(() => {
            setGameState("gameover");
            onGameOver(score);
          }, 800);
        } else {
          // Replay same sequence
          setPlayerInput([]);
          setTimeout(() => {
            playSequence(sequence);
          }, 800);
        }
        return;
      }

      // Correct input
      if (newInput.length === sequence.length) {
        // Level complete
        const newScore = score + 10 * level;
        setScore(newScore);
        onScoreChange?.(newScore);
        speedRef.current = Math.max(300, speedRef.current - 20);
        setLevel(level + 1);
        setGameState("idle");
        setTimeout(() => {
          generateSequence(sequence);
        }, 800);
      }
    },
    [gameState, playerInput, sequence, strikes, score, level, onGameOver, playSequence, generateSequence]
  );

  // Auto-start first round
  useEffect(() => {
    if (sequence.length === 0 && gameState === "idle") {
      // Wait for user to press start
    }
  }, [sequence, gameState]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full max-w-sm mx-auto">
      {gameState === "idle" && sequence.length === 0 ? (
        <div className="text-center">
          <h2 className="text-3xl font-black mb-4">Rapid Tiles</h2>
          <p className="text-gray-500 mb-8">Watch the sequence, then repeat it!</p>
          <Button onClick={startGame} className="h-14 rounded-2xl text-lg font-bold">
            Start Game
          </Button>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="w-full flex justify-between items-center mb-6 px-2">
            <div className="text-center">
              <p className="text-xs text-gray-400 font-bold uppercase">Level</p>
              <p className="text-2xl font-black">{level}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 font-bold uppercase">Score</p>
              <p className="text-2xl font-black text-primary">{score}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 font-bold uppercase">Strikes</p>
              <div className="flex gap-1 justify-center mt-1">
                {Array.from({ length: maxStrikes }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      i < strikes ? "bg-red-500" : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Status */}
          <p className="text-center text-gray-500 font-bold mb-6 h-6">
            {gameState === "showing" && "Watch..."}
            {gameState === "input" && "Your turn!"}
            {gameState === "wrong" && "Wrong!"}
          </p>

          {/* 2x2 Grid */}
          <div className="relative grid grid-cols-2 gap-4 w-full aspect-square max-w-[280px]">
            {[0, 1, 2, 3].map((index) => {
              const isActive = activeTile === index;
              const isShaking = shakeTile === index;

              return (
                <button
                  key={index}
                  onClick={() => handleTap(index)}
                  disabled={gameState !== "input"}
                  className={`rounded-2xl transition-all duration-200 ${
                    isActive ? "scale-105 brightness-125" : "scale-100"
                  } ${isShaking ? "animate-shake" : ""} ${
                    gameState !== "input" ? "cursor-not-allowed" : "active:scale-95 hover:brightness-110"
                  }`}
                  style={{
                    backgroundColor: isActive ? ACTIVE_COLORS[index] : COLORS[index],
                    opacity: gameState === "showing" && !isActive ? 0.6 : 1,
                  }}
                />
              );
            })}

            {/* Sparkles overlay */}
            {sparkles.map((sparkle) => (
              <div
                key={sparkle.id}
                className="pointer-events-none absolute inset-0"
                style={{
                  left: `${sparkle.x}%`,
                  top: `${sparkle.y}%`,
                  animation: `sparkle-pop 0.6s ease-out ${sparkle.delay}s both`,
                }}
              >
                <svg
                  width={sparkle.size}
                  height={sparkle.size}
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{ transform: `rotate(${sparkle.rotation}deg)` }}
                >
                  <path
                    d="M12 0L14.59 8.41L23 12L14.59 15.59L12 24L9.41 15.59L1 12L9.41 8.41L12 0Z"
                    fill={sparkle.color}
                  />
                </svg>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Game Over overlay handled by parent */}
      {gameState === "gameover" && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-3xl text-center">
            <h2 className="text-3xl font-black text-red-500 mb-2">Game Over!</h2>
            <p className="text-gray-500">Score: {score}</p>
          </div>
        </div>
      )}
    </div>
  );
}
