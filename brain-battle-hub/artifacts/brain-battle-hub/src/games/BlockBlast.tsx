import { useState, useEffect, useCallback, useRef } from "react";
import { Zap, Clock, Trophy, Sparkles } from "lucide-react";

const ROWS = 8;
const COLS = 7;
const COLORS = [1, 2, 3, 4];

const COLOR_MAP: Record<number, string> = {
  1: "bg-emerald-400",
  2: "bg-cyan-400",
  3: "bg-pink-400",
  4: "bg-purple-500",
};

const COLOR_BG: Record<number, string> = {
  1: "from-emerald-400 to-emerald-500",
  2: "from-cyan-400 to-cyan-500",
  3: "from-pink-400 to-pink-500",
  4: "from-purple-500 to-purple-600",
};

type Block = { row: number; col: number; color: number; id: number };
type Particle = { id: number; x: number; y: number; color: string; vx: number; vy: number; life: number };

export function BlockBlast({ onGameOver }: { onGameOver: (score: number) => void }) {
  const [grid, setGrid] = useState<number[][]>([]);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(60);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Block[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [blastAnimating, setBlastAnimating] = useState(false);
  const [fallingBlocks, setFallingBlocks] = useState<Set<string>>(new Set());
  const blockIdRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);

  const createGrid = useCallback(() => {
    const newGrid: number[][] = [];
    for (let row = 0; row < ROWS; row++) {
      newGrid[row] = [];
      for (let col = 0; col < COLS; col++) {
        newGrid[row][col] = COLORS[Math.floor(Math.random() * COLORS.length)];
      }
    }
    setGrid(newGrid);
  }, []);

  const startGame = useCallback(() => {
    createGrid();
    setScore(0);
    setTime(60);
    setIsPlaying(true);
    setSelectedGroup([]);
    setParticles([]);
  }, [createGrid]);

  useEffect(() => {
    startGame();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isPlaying) return;

    timerRef.current = window.setInterval(() => {
      setTime((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setIsPlaying(false);
          onGameOver(score);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, onGameOver, score]);

  const findGroup = useCallback((row: number, col: number, color: number): Block[] => {
    const stack: [number, number][] = [[row, col]];
    const visited = new Set<string>();
    const group: Block[] = [];

    while (stack.length > 0) {
      const [r, c] = stack.pop()!;
      const key = `${r},${c}`;

      if (visited.has(key)) continue;
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue;
      if (grid[r][c] !== color) continue;

      visited.add(key);
      group.push({ row: r, col: c, color, id: blockIdRef.current++ });

      stack.push([r + 1, c]);
      stack.push([r - 1, c]);
      stack.push([r, c + 1]);
      stack.push([r, c - 1]);
    }

    return group;
  }, [grid]);

  const createParticles = (blocks: Block[]) => {
    const newParticles: Particle[] = [];
    blocks.forEach((block) => {
      for (let i = 0; i < 5; i++) {
        newParticles.push({
          id: blockIdRef.current++,
          x: block.col * 48 + 24,
          y: block.row * 48 + 24,
          color: COLOR_MAP[block.color],
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8 - 2,
          life: 1,
        });
      }
    });
    setParticles((prev) => [...prev, ...newParticles]);
  };

  const applyGravity = useCallback(() => {
    setGrid((prevGrid) => {
      const newGrid = prevGrid.map((row) => [...row]);
      const falling = new Set<string>();

      for (let col = 0; col < COLS; col++) {
        let empty: number[] = [];

        for (let row = ROWS - 1; row >= 0; row--) {
          if (newGrid[row][col] === 0) {
            empty.push(row);
          } else if (empty.length > 0) {
            const emptyRow = empty.shift()!;
            newGrid[emptyRow][col] = newGrid[row][col];
            newGrid[row][col] = 0;
            empty.push(row);
            falling.add(`${emptyRow},${col}`);
          }
        }
      }

      setFallingBlocks(falling);
      setTimeout(() => setFallingBlocks(new Set()), 300);
      return newGrid;
    });
  }, []);

  const spawnNewBlocks = useCallback(() => {
    setGrid((prevGrid) => {
      const newGrid = prevGrid.map((row) => [...row]);

      for (let col = 0; col < COLS; col++) {
        for (let row = 0; row < ROWS; row++) {
          if (newGrid[row][col] === 0) {
            newGrid[row][col] = COLORS[Math.floor(Math.random() * COLORS.length)];
          }
        }
      }

      return newGrid;
    });
  }, []);

  const handleBlast = useCallback((blocks: Block[]) => {
    const baseScore = blocks.length >= 8 ? 20 : blocks.length >= 5 ? 10 : 5;
    setScore((prev) => prev + baseScore);
    setTime((prev) => Math.min(prev + 3, 99));

    createParticles(blocks);

    setGrid((prevGrid) => {
      const newGrid = prevGrid.map((row) => [...row]);
      blocks.forEach((block) => {
        newGrid[block.row][block.col] = 0;
      });
      return newGrid;
    });

    setBlastAnimating(true);
    setTimeout(() => {
      applyGravity();
      setTimeout(() => {
        spawnNewBlocks();
        setBlastAnimating(false);
      }, 350);
    }, 200);
  }, [applyGravity, spawnNewBlocks]);

  const handleTap = (row: number, col: number) => {
    if (!isPlaying || blastAnimating) return;

    const color = grid[row][col];
    if (color === 0) return;

    const group = findGroup(row, col, color);

    if (group.length < 3) {
      setSelectedGroup(group);
      setTimeout(() => setSelectedGroup([]), 200);
      return;
    }

    setSelectedGroup(group);
    setTimeout(() => {
      handleBlast(group);
      setSelectedGroup([]);
    }, 150);
  };

  useEffect(() => {
    if (particles.length === 0) return;

    const interval = setInterval(() => {
      setParticles((prev) => {
        if (prev.length === 0) {
          clearInterval(interval);
          return prev;
        }
        return prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.3,
            life: p.life - 0.05,
          }))
          .filter((p) => p.life > 0);
      });
    }, 16);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (t: number) => {
    const mins = Math.floor(t / 60);
    const secs = t % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, "0")}` : secs.toString();
  };

  return (
    <div className="flex flex-col w-full max-w-sm mx-auto">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl shadow-sm">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <span className="text-xl font-black">{score}</span>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl shadow-sm ${time <= 10 ? "bg-red-50 animate-pulse" : "bg-white"}`}>
          <Clock className={`w-5 h-5 ${time <= 10 ? "text-red-500" : "text-gray-500"}`} />
          <span className={`text-xl font-black ${time <= 10 ? "text-red-500" : "text-gray-700"}`}>
            {formatTime(time)}
          </span>
        </div>
      </div>

      <div className="relative bg-gray-900/5 rounded-3xl p-2">
        <div className="grid grid-cols-7 gap-1">
          {grid.map((row, rowIdx) =>
            row.map((color, colIdx) => {
              const isSelected = selectedGroup.some((b) => b.row === rowIdx && b.col === colIdx);
              const isFalling = fallingBlocks.has(`${rowIdx},${colIdx}`);
              const blockKey = `${rowIdx}-${colIdx}`;

              return (
                <button
                  key={blockKey}
                  onClick={() => handleTap(rowIdx, colIdx)}
                  disabled={!isPlaying || blastAnimating}
                  className={`
                    aspect-square rounded-xl transition-all duration-150
                    ${color === 0 ? "bg-transparent" : COLOR_MAP[color]}
                    ${isSelected ? "scale-110 ring-4 ring-white ring-offset-2 shadow-lg z-10" : "hover:brightness-110"}
                    ${isFalling ? "animate-bounce" : ""}
                  `}
                >
                  {color !== 0 && (
                    <div className={`w-full h-full rounded-xl bg-gradient-to-br ${COLOR_BG[color]} opacity-60`} />
                  )}
                </button>
              );
            })
          )}
        </div>

        {particles.map((p) => (
          <div
            key={p.id}
            className={`absolute w-3 h-3 rounded-full ${p.color}`}
            style={{
              left: p.x,
              top: p.y,
              opacity: p.life,
              transform: `translate(-50%, -50%)`,
              pointerEvents: "none",
            }}
          />
        ))}
      </div>

      <div className="mt-4 text-center text-sm text-gray-400">
        Tap groups of 3+ blocks
      </div>
    </div>
  );
}