import { useEffect, useRef, useState } from "react";

const rows = 8;
const cols = 8;
const colors = [1, 2, 3, 4];

const colorsMap: Record<number, string> = {
  1: "#b6ff00",
  2: "#00e5ff",
  3: "#ff00d4",
  4: "#8a2be2",
};

export function BlockBlast({ onGameOver }: { onGameOver: (score: number) => void }) {
  const [grid, setGrid] = useState<number[][]>([]);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(60);
  const [gameOver, setGameOver] = useState(false);
  const [popCells, setPopCells] = useState<string[]>([]);
  const [fallCells, setFallCells] = useState<string[]>([]);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; color: string }[]>([]);
  const timerRef = useRef<number | null>(null);
  const idRef = useRef(0);

  const randomColor = () => colors[Math.floor(Math.random() * colors.length)];

  const createGrid = () => {
    const newGrid: number[][] = [];
    for (let r = 0; r < rows; r++) {
      const row: number[] = [];
      for (let c = 0; c < cols; c++) {
        row.push(randomColor());
      }
      newGrid.push(row);
    }
    setGrid(newGrid);
  };

  const findGroup = (r: number, c: number, color: number): [number, number][] => {
    const stack: [number, number][] = [[r, c]];
    const visited = new Set<string>();
    const group: [number, number][] = [];

    while (stack.length) {
      const [x, y] = stack.pop()!;
      const key = `${x},${y}`;

      if (visited.has(key)) continue;
      if (x < 0 || y < 0 || x >= rows || y >= cols) continue;
      if (grid[x]?.[y] !== color) continue;

      visited.add(key);
      group.push([x, y]);

      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }

    return group;
  };

  const createParticles = (r: number, c: number, colorIndex: number) => {
    const newParticles = [];
    for (let i = 0; i < 8; i++) {
      newParticles.push({
        id: idRef.current++,
        x: (Math.random() - 0.5) * 80,
        y: (Math.random() - 0.5) * 80,
        color: colorsMap[colorIndex],
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 600);
  };

  const handleClick = (r: number, c: number) => {
    if (gameOver || grid[r]?.[c] == null) return;

    const color = grid[r][c];
    const group = findGroup(r, c, color);

    if (group.length >= 3) {
      const cellIds = group.map(([x, y]) => `${x},${y}`);
      setPopCells(cellIds);
      group.forEach(([x, y]) => createParticles(x, y, grid[x][y]));

      setTimeout(() => {
        const newGrid = grid.map(row => [...row]);
        group.forEach(([x, y]) => {
          newGrid[x][y] = 0;
        });

        for (let col = 0; col < cols; col++) {
          const stack: number[] = [];
          for (let row = rows - 1; row >= 0; row--) {
            if (newGrid[row][col] !== 0) {
              stack.push(newGrid[row][col]);
            }
          }
          for (let row = rows - 1; row >= 0; row--) {
            newGrid[row][col] = stack.shift() || 0;
          }
          for (let row = 0; row < rows; row++) {
            if (newGrid[row][col] === 0) {
              newGrid[row][col] = randomColor();
            }
          }
        }

        setGrid(newGrid);
        setScore(s => s + group.length * 5);
        setTime(t => t + 3);
        setPopCells([]);
        setFallCells(cellIds);
        setTimeout(() => setFallCells([]), 250);
      }, 200);
    }
  };

  const restart = () => {
    setScore(0);
    setTime(60);
    setGameOver(false);
    createGrid();
  };

  useEffect(() => {
    createGrid();
  }, []);

  useEffect(() => {
    if (gameOver) return;
    if (time <= 0) {
      setGameOver(true);
      onGameOver(score);
      return;
    }

    timerRef.current = window.setInterval(() => {
      setTime(t => t - 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [time, gameOver, score, onGameOver]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 bg-[#0b0f1a]">
      <div className="w-full max-w-[400px] mb-4 flex justify-between text-white text-xl font-bold">
        <div>Score: <span>{score}</span></div>
        <div>Time: <span>{time}</span></div>
      </div>

      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${cols}, 45px)` }}
      >
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const cellId = `${r},${c}`;
            const isPop = popCells.includes(cellId);
            const isFall = fallCells.includes(cellId);
            const isEmpty = cell === 0;

            return (
              <div
                key={`${r}-${c}`}
                className={`w-[45px] h-[45px] rounded-lg cursor-pointer transition-all duration-200 ${
                  isEmpty ? "opacity-0" : ""
                } ${isPop ? "animate-[pop_0.25s_ease_forwards]" : ""} ${
                  isFall ? "animate-[fall_0.25s_ease]" : ""
                }`}
                style={{
                  background: cell ? colorsMap[cell] : "transparent",
                  transform: isPop ? "scale(1.4)" : isPop ? "scale(0)" : undefined,
                  opacity: isPop ? 0 : undefined,
                }}
                onClick={() => handleClick(r, c)}
              />
            );
          })
        )}
      </div>

      {particles.map(p => (
        <div
          key={p.id}
          className="absolute w-2 h-2 rounded-full pointer-events-none animate-[explode_0.6s_ease-out_forwards]"
          style={{
            left: "50%",
            top: "50%",
            background: p.color,
            transform: `translate(calc(-50% + ${p.x}px), calc(-50% + ${p.y}px))`,
            opacity: 0,
          }}
        />
      ))}

      {gameOver && (
        <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50">
          <h1 className="text-3xl font-bold text-white mb-4">Game Over</h1>
          <p className="text-xl text-white mb-4">Score: {score}</p>
          <button
            onClick={restart}
            className="px-6 py-3 text-lg bg-white text-black rounded-lg font-bold"
          >
            Restart
          </button>
        </div>
      )}
    </div>
  );
}