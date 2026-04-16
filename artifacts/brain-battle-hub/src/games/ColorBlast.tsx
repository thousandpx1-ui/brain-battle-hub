import { useState, useEffect, useRef, useCallback } from "react";

const ROWS = 5;
const COLS = 5;
const COLORS = [1, 2, 3, 4]; // 1=Green, 2=Cyan, 3=Pink, 4=Purple

type BlockColor = number | null;
type Grid = BlockColor[][];

function randomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

function findGroup(grid: Grid, x: number, y: number, color: number): [number, number][] {
  let stack: [number, number][] = [[x, y]];
  let visited = new Set<string>();
  let group: [number, number][] = [];
  
  while (stack.length) {
    let [cx, cy] = stack.pop()!;
    let key = `${cx},${cy}`;
    if (visited.has(key)) continue;
    if (cx < 0 || cx >= ROWS || cy < 0 || cy >= COLS) continue;
    if (grid[cx][cy] !== color) continue;
    visited.add(key);
    group.push([cx, cy]);
    stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
  }
  return group;
}

function applyGravity(grid: Grid): Grid {
  const newGrid = grid.map(row => [...row]);
  for (let col = 0; col < COLS; col++) {
    let empty: number[] = [];
    for (let row = ROWS - 1; row >= 0; row--) {
      if (newGrid[row][col] === null) {
        empty.push(row);
      } else if (empty.length > 0) {
        let emptyRow = empty.shift()!;
        newGrid[emptyRow][col] = newGrid[row][col];
        newGrid[row][col] = null;
        empty.push(row);
      }
    }
  }
  return newGrid;
}

function spawnNewBlocks(grid: Grid): Grid {
  const newGrid = grid.map(row => [...row]);
  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row < ROWS; row++) {
      if (newGrid[row][col] === null) {
        newGrid[row][col] = randomColor();
      }
    }
  }
  return newGrid;
}

const colorClasses: Record<number, string> = {
  1: 'bg-green-400',
  2: 'bg-cyan-400',
  3: 'bg-pink-400',
  4: 'bg-purple-500',
};

export function ColorBlast({ onGameOver }: { onGameOver: (score: number) => void }) {
  const [grid, setGrid] = useState<Grid>([]);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(60);
  const [activeBooster, setActiveBooster] = useState<'combo' | 'rainbow' | 'bomb' | null>(null);
  const [poppingBlocks, setPoppingBlocks] = useState<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gameActiveRef = useRef(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initGame = useCallback(() => {
    const newGrid: Grid = Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => randomColor())
    );
    setGrid(newGrid);
    setScore(0);
    setTime(60);
    setPoppingBlocks(new Set());
    setActiveBooster(null);
    gameActiveRef.current = true;
  }, []);

  useEffect(() => {
    initGame();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [initGame]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (!gameActiveRef.current) return;
      setTime(prev => {
        if (prev <= 1) {
          gameActiveRef.current = false;
          clearInterval(timerRef.current!);
          setTimeout(() => onGameOver(0), 100);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [onGameOver]);

  const finishMove = useCallback((updatedGrid: Grid) => {
    const withGravity = applyGravity(updatedGrid);
    const withNewBlocks = spawnNewBlocks(withGravity);
    setPoppingBlocks(new Set());
    timeoutRef.current = setTimeout(() => {
      setGrid(withNewBlocks);
    }, 300);
  }, []);

  const handleBlockClick = useCallback((r: number, c: number) => {
    if (!gameActiveRef.current) return;
    setGrid(currentGrid => {
      if (currentGrid[r][c] === null) return currentGrid;

      if (activeBooster === 'bomb') {
        const newGrid = currentGrid.map(row => [...row]);
        let destroyedCount = 0;
        for (let i = r - 1; i <= r + 1; i++) {
          for (let j = c - 1; j <= c + 1; j++) {
            if (i >= 0 && i < ROWS && j >= 0 && j < COLS && newGrid[i][j] !== null) {
              newGrid[i][j] = null;
              destroyedCount++;
            }
          }
        }
        setScore(prev => prev + 10);
        setActiveBooster(null);
        
        const popped = new Set<string>();
        for (let i = r - 1; i <= r + 1; i++) {
          for (let j = c - 1; j <= c + 1; j++) {
            if (i >= 0 && i < ROWS && j >= 0 && j < COLS) {
              popped.add(`${i},${j}`);
            }
          }
        }
        setPoppingBlocks(popped);
        finishMove(newGrid);
        return newGrid;
      }

      if (activeBooster === 'rainbow') {
        const targetColor = currentGrid[r][c];
        if (targetColor === null) return currentGrid;
        const newGrid = currentGrid.map(row => [...row]);
        let removedCount = 0;
        const popped = new Set<string>();
        for (let i = 0; i < ROWS; i++) {
          for (let j = 0; j < COLS; j++) {
            if (newGrid[i][j] === targetColor) {
              newGrid[i][j] = null;
              removedCount++;
              popped.add(`${i},${j}`);
            }
          }
        }
        if (removedCount > 0) {
          setScore(prev => prev + 15);
          setTime(prev => prev + 5);
        }
        setActiveBooster(null);
        setPoppingBlocks(popped);
        finishMove(newGrid);
        return newGrid;
      }

      // Normal play
      const color = currentGrid[r][c];
      if (color === null) return currentGrid;
      const group = findGroup(currentGrid, r, c, color);
      
      if (group.length >= 3) {
        let points = 5;
        let timeBonus = 3;
        
        if (activeBooster === 'combo') {
          points *= 2;
          timeBonus *= 2;
          setActiveBooster(null);
        }
        
        setScore(prev => prev + points);
        setTime(prev => prev + timeBonus);
        
        const newGrid = currentGrid.map(row => [...row]);
        const popped = new Set<string>();
        group.forEach(([gr, gc]) => {
          newGrid[gr][gc] = null;
          popped.add(`${gr},${gc}`);
        });
        setPoppingBlocks(popped);
        finishMove(newGrid);
        return newGrid;
      }
      
      return currentGrid;
    });
  }, [activeBooster, finishMove]);

  const toggleBooster = useCallback((type: 'combo' | 'rainbow' | 'bomb') => {
    setActiveBooster(prev => prev === type ? null : type);
  }, []);

  if (grid.length === 0) return null;

  return (
    <div className="flex flex-col items-center w-full h-full max-w-md mx-auto">
      {/* Header */}
      <div className="w-full bg-amber-700 text-white p-4 rounded-xl mb-4 flex justify-between shadow-md shadow-amber-900">
        <div className="font-bold text-lg">Score: {score}</div>
        <div className={`font-bold text-lg ${time <= 10 ? 'text-red-300' : ''}`}>Time: {time}</div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-5 gap-1.5 bg-amber-700 p-1.5 rounded-xl mb-4 w-full max-w-[320px]">
        {grid.flat().map((val, idx) => {
          const row = Math.floor(idx / COLS);
          const col = idx % COLS;
          const key = `${row},${col}`;
          const isPopping = poppingBlocks.has(key);
          
          return (
            <div
              key={key}
              data-row={row}
              data-col={col}
              className={`
                aspect-square rounded-lg transition-all duration-200
                ${val === null ? 'bg-transparent' : 
                  `${colorClasses[val]} shadow-inner cursor-pointer hover:scale-95 active:scale-90 
                   flex justify-end items-start p-1 text-xs font-bold text-black/30`
                }
                ${isPopping ? 'animate-ping opacity-0' : ''}
              `}
              onClick={() => val !== null && handleBlockClick(row, col)}
            >
              {val !== null && val}
            </div>
          );
        })}
      </div>

      {/* Boosters */}
      <div className="w-full max-w-[320px] flex justify-around">
        {[
          { type: 'combo' as const, icon: '⚡', label: 'Combo Boost' },
          { type: 'rainbow' as const, icon: '🌈', label: 'Rainbow' },
          { type: 'bomb' as const, icon: '💣', label: 'Bomb' },
        ].map(({ type, icon, label }) => (
          <button
            key={type}
            onClick={() => toggleBooster(type)}
            className={`flex flex-col items-center p-3 rounded-lg transition-all duration-200 w-24
              ${activeBooster === type 
                ? 'bg-blue-100 border-2 border-blue-500 -translate-y-1' 
                : 'hover:bg-gray-100'
              }`}
          >
            <span className="text-2xl mb-1">{icon}</span>
            <span className="text-xs font-bold text-gray-600">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}