import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const ROWS = 8;
const COLS = 8;
const START_TIME = 50;
const MIN_GROUP_SIZE = 3;
const POINTS_PER_BLOCK = 5;
const TIME_BONUS_PER_BLAST = 3;
const COLOR_IDS = [0, 1, 2, 3, 4, 5] as const;

type BlockId = (typeof COLOR_IDS)[number];
type Grid = CellState[][];
type Position = { row: number; col: number };
type GamePhase = "menu" | "playing" | "gameover";

type CellState = {
  blockId: BlockId;
  isFalling: boolean;
};

const BLOCK_STYLES: Record<
  BlockId,
  { bg: string; glow: string; ring: string; label: string }
> = {
  0: {
    bg: "linear-gradient(135deg, #ccff00 0%, #8fff00 100%)",
    glow: "0 0 18px rgba(204,255,0,0.65), inset 0 1px 0 rgba(255,255,255,0.35)",
    ring: "rgba(204,255,0,0.9)",
    label: "Lime",
  },
  1: {
    bg: "linear-gradient(135deg, #00ffff 0%, #00b8ff 100%)",
    glow: "0 0 18px rgba(0,255,255,0.65), inset 0 1px 0 rgba(255,255,255,0.35)",
    ring: "rgba(0,255,255,0.95)",
    label: "Cyan",
  },
  2: {
    bg: "linear-gradient(135deg, #ff00ff 0%, #ff5ac8 100%)",
    glow: "0 0 18px rgba(255,0,255,0.6), inset 0 1px 0 rgba(255,255,255,0.35)",
    ring: "rgba(255,0,255,0.95)",
    label: "Magenta",
  },
  3: {
    bg: "linear-gradient(135deg, #9d00ff 0%, #6100ff 100%)",
    glow: "0 0 18px rgba(157,0,255,0.6), inset 0 1px 0 rgba(255,255,255,0.35)",
    ring: "rgba(157,0,255,0.95)",
    label: "Purple",
  },
  4: {
    bg: "linear-gradient(135deg, #ffff00 0%, #ffbf00 100%)",
    glow: "0 0 18px rgba(255,255,0,0.6), inset 0 1px 0 rgba(255,255,255,0.35)",
    ring: "rgba(255,255,0,0.95)",
    label: "Yellow",
  },
  5: {
    bg: "linear-gradient(135deg, #ff7a00 0%, #ff3d00 100%)",
    glow: "0 0 18px rgba(255,122,0,0.6), inset 0 1px 0 rgba(255,255,255,0.35)",
    ring: "rgba(255,122,0,0.95)",
    label: "Orange",
  },
};

function randomBlock(): BlockId {
  return COLOR_IDS[Math.floor(Math.random() * COLOR_IDS.length)];
}

function createGrid(initiallyFalling = false): Grid {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({
      blockId: randomBlock(),
      isFalling: initiallyFalling,
    })),
  );
}

function createGridWithGravity(clearedPositions: Position[]): Grid {
  const newGrid: Grid = Array(ROWS)
    .fill(null)
    .map(() =>
      Array(COLS)
        .fill(null)
        .map(() => ({ blockId: randomBlock(), isFalling: false })),
    );

  const clearedSet = new Set(
    clearedPositions.map((p) => cellKey(p.row, p.col)),
  );

  for (let col = 0; col < COLS; col++) {
    let writeRow = ROWS - 1;
    for (let row = ROWS - 1; row >= 0; row--) {
      if (!clearedSet.has(cellKey(row, col))) {
        newGrid[writeRow][col] = { ...newGrid[row][col] };
        writeRow--;
      }
    }
    for (let row = writeRow; row >= 0; row--) {
      newGrid[row][col] = { blockId: randomBlock(), isFalling: true };
    }
  }

  return newGrid;
}

function cellKey(row: number, col: number): string {
  return `${row},${col}`;
}

function findConnectedGroup(
  grid: Grid,
  startRow: number,
  startCol: number,
): Position[] {
  const target = grid[startRow]?.[startCol];
  if (!target) return [];

  const visited = new Set<string>();
  const stack: Position[] = [{ row: startRow, col: startCol }];
  const group: Position[] = [];

  while (stack.length > 0) {
    const current = stack.pop()!;
    const key = cellKey(current.row, current.col);

    if (
      current.row < 0 ||
      current.row >= ROWS ||
      current.col < 0 ||
      current.col >= COLS ||
      visited.has(key) ||
      grid[current.row][current.col].blockId !== target.blockId
    ) {
      continue;
    }

    visited.add(key);
    group.push(current);

    stack.push(
      { row: current.row + 1, col: current.col },
      { row: current.row - 1, col: current.col },
      { row: current.row, col: current.col + 1 },
      { row: current.row, col: current.col - 1 },
    );
  }

  return group;
}

function hasValidMatches(grid: Grid): boolean {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const group = findConnectedGroup(grid, row, col);
      if (group.length >= MIN_GROUP_SIZE) return true;
    }
  }
  return false;
}

function refillGridWithoutGravity(grid: Grid, cleared: Position[]): Grid {
  const clearedSet = new Set(cleared.map((pos) => cellKey(pos.row, pos.col)));

  return grid.map((row, rowIndex) =>
    row.map((cell, colIndex) =>
      clearedSet.has(cellKey(rowIndex, colIndex))
        ? { blockId: randomBlock(), isFalling: false }
        : cell,
    ),
  );
}

export function ColorBlast({
  onGameOver,
  onScoreChange,
}: {
  onGameOver: (score: number) => void;
  onScoreChange?: (score: number) => void;
}) {
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [grid, setGrid] = useState<Grid>(() => createGrid());
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(START_TIME);
  const [selectedGroup, setSelectedGroup] = useState<Set<string>>(new Set());
  const [blastingGroup, setBlastingGroup] = useState<Set<string>>(new Set());
  const [floatingScore, setFloatingScore] = useState<string | null>(null);
  const [floatingTime, setFloatingTime] = useState<string | null>(null);
  const [invalidPulse, setInvalidPulse] = useState<Set<string>>(new Set());
  const [lastActionLabel, setLastActionLabel] = useState(
    "Tap any neon cluster of 3+ blocks",
  );
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scorePopupRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timePopupRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const invalidRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blastRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gameOverSentRef = useRef(false);

  const resetGame = useCallback(() => {
    let newGrid = createGrid(false);
    while (!hasValidMatches(newGrid)) {
      newGrid = createGrid(false);
    }
    setGrid(newGrid);
    setScore(0);
    setTimeLeft(START_TIME);
    setSelectedGroup(new Set());
    setBlastingGroup(new Set());
    setFloatingScore(null);
    setFloatingTime(null);
    setInvalidPulse(new Set());
    setLastActionLabel("Tap any neon cluster of 3+ blocks");
    setPhase("playing");
    gameOverSentRef.current = false;
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (scorePopupRef.current) clearTimeout(scorePopupRef.current);
      if (timePopupRef.current) clearTimeout(timePopupRef.current);
      if (invalidRef.current) clearTimeout(invalidRef.current);
      if (blastRef.current) clearTimeout(blastRef.current);
    };
  }, []);

  useEffect(() => {
    if (phase !== "playing") {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const getTickInterval = () => {
      if (score >= 10000) return 600;
      if (score >= 5000) return 700;
      if (score >= 2500) return 800;
      if (score >= 1000) return 900;
      return 1000;
    };

    const interval = setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }

        return current - 1;
      });
    }, getTickInterval());

    timerRef.current = interval;

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, score]);

  useEffect(() => {
    if (phase !== "playing" || timeLeft > 0 || gameOverSentRef.current) return;

    gameOverSentRef.current = true;
    setPhase("gameover");
    onGameOver(score);
  }, [onGameOver, phase, score, timeLeft]);

  useEffect(() => {
    const hasFalling = grid.some((row) => row.some((cell) => cell.isFalling));
    if (!hasFalling) return;

    fallingRef.current = setTimeout(() => {
      setGrid((currentGrid) =>
        currentGrid.map((row) =>
          row.map((cell) => ({ ...cell, isFalling: false })),
        ),
      );
    }, 450);

    return () => {
      if (fallingRef.current) clearTimeout(fallingRef.current);
    };
  }, [grid]);

  const timeToneClass = useMemo(() => {
    if (timeLeft <= 10) return "text-red-400 animate-pulse";
    if (timeLeft <= 20) return "text-yellow-300";
    return "text-cyan-300";
  }, [timeLeft]);

  const handleHover = useCallback(
    (row: number, col: number) => {
      if (phase !== "playing" || blastingGroup.size > 0) return;

      const group = findConnectedGroup(grid, row, col);
      if (group.length >= MIN_GROUP_SIZE) {
        setSelectedGroup(
          new Set(group.map((pos) => cellKey(pos.row, pos.col))),
        );
      } else {
        setSelectedGroup(new Set([cellKey(row, col)]));
      }
    },
    [blastingGroup.size, grid, phase],
  );

  const clearTransientFeedback = useCallback(() => {
    if (scorePopupRef.current) clearTimeout(scorePopupRef.current);
    if (timePopupRef.current) clearTimeout(timePopupRef.current);
    if (invalidRef.current) clearTimeout(invalidRef.current);
  }, []);

  const handleTap = useCallback(
    (row: number, col: number) => {
      if (phase !== "playing" || blastingGroup.size > 0) return;

      const group = findConnectedGroup(grid, row, col);
      const groupKeys = new Set(group.map((pos) => cellKey(pos.row, pos.col)));
      setSelectedGroup(groupKeys);

      if (group.length < MIN_GROUP_SIZE) {
        clearTransientFeedback();
        setInvalidPulse(groupKeys);
        setLastActionLabel("Need at least 3 connected blocks");
        invalidRef.current = setTimeout(() => {
          setInvalidPulse(new Set());
        }, 280);
        return;
      }

      const blastPoints = group.length * POINTS_PER_BLOCK;
      clearTransientFeedback();
      setBlastingGroup(groupKeys);
      setFloatingScore(`+${blastPoints}`);
      setFloatingTime(`+${TIME_BONUS_PER_BLAST}s`);
      setLastActionLabel(`${group.length} blocks blasted`);

      setScore((current) => {
        const next = current + blastPoints;
        onScoreChange?.(next);
        return next;
      });
      setTimeLeft((current) => current + TIME_BONUS_PER_BLAST);

      scorePopupRef.current = setTimeout(() => setFloatingScore(null), 850);
      timePopupRef.current = setTimeout(() => setFloatingTime(null), 850);

      blastRef.current = setTimeout(() => {
        setGrid(createGridWithGravity(group));
        setSelectedGroup(new Set());
        setBlastingGroup(new Set());
      }, 220);
    },
    [blastingGroup.size, clearTransientFeedback, grid, phase],
  );

  return (
    <div className="mx-auto flex h-full w-full max-w-md flex-col items-center justify-start px-1 pb-6 text-white">
      <div className="w-full overflow-hidden rounded-[32px] border border-white/10 bg-[#07090f] shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <div className="border-b border-white/10 bg-[radial-gradient(circle_at_top,#14213d_0%,#090b12_65%)] px-5 py-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-white/40">
                Score
              </p>
              <div className="text-3xl font-black text-white">{score}</div>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-white/40">
                Time
              </p>
              <div className={`text-3xl font-black ${timeToneClass}`}>
                {timeLeft}
              </div>
              {score >= 1000 && (
                <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-orange-400 animate-pulse">
                  Speed UP!
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-cyan-200/70">
                Goal
              </p>
              <p className="mt-1 text-sm font-semibold text-cyan-50">
                Tap groups of 3+ matching blocks
              </p>
            </div>
            <div className="rounded-2xl border border-fuchsia-400/20 bg-fuchsia-400/10 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-fuchsia-200/70">
                Bonus
              </p>
              <p className="mt-1 text-sm font-semibold text-fuchsia-50">
                +{POINTS_PER_BLOCK} each • +{TIME_BONUS_PER_BLAST}s blast
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 pb-5 pt-4">
          {phase === "menu" && (
            <div className="flex min-h-[520px] flex-col items-center justify-center text-center">
              <div className="mb-5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.4em] text-cyan-200">
                Block Blast
              </div>
              <h2 className="text-4xl font-black tracking-tight text-white">
                Tap. Blast. Survive.
              </h2>
              <p className="mt-4 max-w-xs text-sm leading-6 text-white/65">
                Blast neon clusters of 3 or more matching blocks before the
                timer ends. Every successful blast adds points and bonus time.
              </p>

              <div className="mt-8 grid w-full max-w-xs gap-3 rounded-[28px] border border-white/10 bg-white/5 p-4 text-left">
                <div className="rounded-2xl bg-black/20 p-3">
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/45">
                    Grid
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white/90">
                    8 × 8 neon block board
                  </p>
                </div>
                <div className="rounded-2xl bg-black/20 p-3">
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/45">
                    Rules
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white/90">
                    Only connected groups of 3+ will blast
                  </p>
                </div>
                <div className="rounded-2xl bg-black/20 p-3">
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/45">
                    Refill
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white/90">
                    New blocks refill cleared cells from above
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={resetGame}
                className="mt-8 rounded-full bg-[linear-gradient(135deg,#00ffff,#9d00ff)] px-8 py-4 text-base font-black tracking-[0.2em] text-black shadow-[0_0_30px_rgba(0,255,255,0.35)] transition-transform duration-200 hover:scale-[1.02] active:scale-95"
              >
                PLAY
              </button>
            </div>
          )}

          {(phase === "playing" || phase === "gameover") && (
            <div className="relative">
              <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/45">
                  {phase === "gameover" ? "Final Run" : "Live Feed"}
                </p>
                <p className="text-right text-sm font-semibold text-white/80">
                  {lastActionLabel}
                </p>
              </div>

              <div className="relative rounded-[28px] border border-white/10 bg-[#0c1018] p-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]">
                <div className="grid grid-cols-8 gap-2">
                  {grid.flatMap((row, rowIndex) =>
                    row.map((block, colIndex) => {
                      const key = cellKey(rowIndex, colIndex);
                      const isSelected = selectedGroup.has(key);
                      const isBlasting = blastingGroup.has(key);
                      const isInvalid = invalidPulse.has(key);
                      const isFalling = block.isFalling;
                      const style = BLOCK_STYLES[block.blockId];

                      return (
                        <button
                          key={key}
                          type="button"
                          aria-label={`${style.label} block at row ${rowIndex + 1} column ${colIndex + 1}`}
                          onMouseEnter={() => handleHover(rowIndex, colIndex)}
                          onFocus={() => handleHover(rowIndex, colIndex)}
                          onMouseLeave={() => setSelectedGroup(new Set())}
                          onClick={() => handleTap(rowIndex, colIndex)}
                          disabled={phase !== "playing"}
                          className={`relative aspect-square rounded-[14px] border border-white/10 transition-all duration-200 ${
                            isSelected ? "scale-105" : "scale-100"
                          } ${isInvalid ? "animate-pulse" : ""} ${
                            isFalling ? "animate-fall-in" : ""
                          } ${
                            phase === "playing"
                              ? "cursor-pointer active:scale-95"
                              : "cursor-default opacity-80"
                          }`}
                          style={{
                            background: style.bg,
                            boxShadow: isBlasting
                              ? `0 0 24px ${style.ring}, 0 0 48px ${style.ring}`
                              : isSelected
                                ? `0 0 18px ${style.ring}, ${style.glow}`
                                : style.glow,
                            opacity: isBlasting ? 0.2 : 1,
                            transform: isBlasting
                              ? "scale(0.72) rotate(8deg)"
                              : isInvalid
                                ? "translateX(-2px)"
                                : undefined,
                          }}
                        >
                          <span className="absolute inset-x-1 top-1 h-2 rounded-full bg-white/30 blur-[1px]" />
                          <span className="absolute inset-0 rounded-[14px] border border-white/15" />
                        </button>
                      );
                    }),
                  )}
                </div>

                {floatingScore && (
                  <div className="pointer-events-none absolute left-6 top-5 animate-bounce text-xl font-black text-lime-300 drop-shadow-[0_0_12px_rgba(204,255,0,0.8)]">
                    {floatingScore}
                  </div>
                )}

                {floatingTime && (
                  <div className="pointer-events-none absolute right-6 top-5 animate-bounce text-xl font-black text-cyan-300 drop-shadow-[0_0_12px_rgba(0,255,255,0.8)]">
                    {floatingTime}
                  </div>
                )}
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-[0.22em] text-white/40">
                  <span>Neon Colors</span>
                  <span>
                    {ROWS}x{COLS} Grid
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {COLOR_IDS.map((id) => {
                    const style = BLOCK_STYLES[id];
                    return (
                      <div
                        key={id}
                        className="flex items-center gap-2 rounded-xl bg-black/20 px-3 py-2"
                      >
                        <span
                          className="h-4 w-4 rounded-full border border-white/20"
                          style={{
                            background: style.bg,
                            boxShadow: style.glow,
                          }}
                        />
                        <span className="text-xs font-semibold text-white/80">
                          {style.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {phase === "gameover" && (
                <div className="absolute inset-0 flex items-center justify-center rounded-[28px] bg-[rgba(4,6,10,0.82)] backdrop-blur-sm">
                  <div className="mx-4 w-full max-w-xs rounded-[28px] border border-white/10 bg-[#0b0f18] p-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
                    <div className="mb-3 text-xs font-bold uppercase tracking-[0.38em] text-fuchsia-300">
                      Game Over
                    </div>
                    <h3 className="text-4xl font-black text-white">{score}</h3>
                    <p className="mt-2 text-sm text-white/65">
                      Final score after the clock hit zero
                    </p>

                    <div className="mt-5 grid grid-cols-2 gap-3 text-left">
                      <div className="rounded-2xl bg-white/5 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/40">
                          Blocks
                        </p>
                        <p className="mt-1 text-lg font-black text-lime-300">
                          {Math.floor(score / POINTS_PER_BLOCK)}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white/5 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/40">
                          Bonus
                        </p>
                        <p className="mt-1 text-lg font-black text-cyan-300">
                          +{TIME_BONUS_PER_BLAST}s
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={resetGame}
                      className="mt-6 w-full rounded-full bg-[linear-gradient(135deg,#ccff00,#00ffff)] px-6 py-3 text-sm font-black tracking-[0.24em] text-black shadow-[0_0_24px_rgba(0,255,255,0.3)] transition-transform duration-200 hover:scale-[1.02] active:scale-95"
                    >
                      RESTART
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
