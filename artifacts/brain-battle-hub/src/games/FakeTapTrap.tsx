import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

type TapButton = {
  id: number;
  text: string;
  isReal: boolean;
  x: number;
  y: number;
  color: string;
};

const FAKE_TEXTS = ["NOT THIS", "FAKE", "WRONG", "NOPE", "IGNORE", "TRAP", "MISS", "SKIP"];
const REAL_COLOR = "bg-emerald-500";
const FAKE_COLORS = ["bg-red-500", "bg-blue-500", "bg-yellow-500", "bg-purple-500", "bg-orange-500", "bg-pink-500"];

function randomPos(containerEl: HTMLDivElement): { x: number; y: number } {
  const { width, height } = containerEl.getBoundingClientRect();
  const btnW = 110;
  const btnH = 48;
  return {
    x: Math.max(8, Math.random() * (width - btnW - 8)),
    y: Math.max(8, Math.random() * (height - btnH - 8)),
  };
}

export function FakeTapTrap({
  onGameOver,
  onScoreChange,
}: {
  onGameOver: (score: number) => void;
  onScoreChange?: (score: number) => void;
}) {
  const [score, setScore] = useState(0);
  const [buttons, setButtons] = useState<TapButton[]>([]);
  const [ready, setReady] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef(0);
  const doneRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const spawnRound = useCallback(() => {
    const el = containerRef.current;
    if (!el || doneRef.current) return;

    const cur = scoreRef.current;
    const fakeCount = Math.min(1 + Math.floor(cur / 2), 6);

    const all: TapButton[] = [];

    // Real button
    all.push({
      id: Date.now(),
      text: "TAP ME",
      isReal: true,
      ...randomPos(el),
      color: REAL_COLOR,
    });

    // Fake buttons — make sure they don't overlap the real one
    for (let i = 0; i < fakeCount; i++) {
      all.push({
        id: Date.now() + i + 1,
        text: FAKE_TEXTS[Math.floor(Math.random() * FAKE_TEXTS.length)],
        isReal: false,
        ...randomPos(el),
        color: FAKE_COLORS[Math.floor(Math.random() * FAKE_COLORS.length)],
      });
    }

    setButtons(all);
  }, []);

  // Start game after container mounts and has dimensions
  useEffect(() => {
    const timeout = setTimeout(() => {
      setReady(true);
      spawnRound();
    }, 120);
    return () => clearTimeout(timeout);
  }, [spawnRound]);

  // Spawn an extra fake button every interval (gets faster with score)
  useEffect(() => {
    if (!ready) return;

    const delay = Math.max(1600 - scoreRef.current * 60, 500);
    intervalRef.current = setInterval(() => {
      const el = containerRef.current;
      if (!el || doneRef.current) return;
      setButtons(prev => {
        if (prev.length >= 10) return prev; // cap at 10
        return [
          ...prev,
          {
            id: Date.now() + Math.random(),
            text: FAKE_TEXTS[Math.floor(Math.random() * FAKE_TEXTS.length)],
            isReal: false,
            ...randomPos(el),
            color: FAKE_COLORS[Math.floor(Math.random() * FAKE_COLORS.length)],
          },
        ];
      });
    }, delay);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [ready, score]);

  const handleTap = useCallback(
    (btn: TapButton) => {
      if (doneRef.current) return;

      if (btn.isReal) {
        // Give more points as score increases (scaling reward)
        const basePoints = 10;
        const streakBonus = Math.floor(scoreRef.current / 10) * 2; // Bonus every 10 taps
        const next = scoreRef.current + basePoints + streakBonus;
        scoreRef.current = next;
        setScore(next);
        onScoreChange?.(next);
        // Spawn fresh round right away
        setTimeout(() => spawnRound(), 80);
      } else {
        doneRef.current = true;
        if (intervalRef.current) clearInterval(intervalRef.current);
        onGameOver(Math.max(scoreRef.current, 100));
      }
    },
    [onGameOver, spawnRound],
  );

  return (
    <div className="flex flex-col items-center w-full h-full">
      {/* Score */}
      <div className="mb-3 text-center shrink-0">
        <h2 className="text-4xl font-black tabular-nums">{score}</h2>
        <p className="text-sm text-gray-500 mt-0.5">Tap the green button — +5 base points per tap!</p>
      </div>

      {/* Game area */}
      <div
        ref={containerRef}
        className="flex-1 w-full relative overflow-hidden bg-gray-50 rounded-3xl"
      >
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-400 font-semibold">Get ready…</p>
          </div>
        )}

        <AnimatePresence>
          {buttons.map(b => (
            <motion.button
              key={b.id}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => {
                e.stopPropagation();
                handleTap(b);
              }}
              style={{ position: "absolute", left: b.x, top: b.y }}
              className={`px-4 py-2.5 rounded-full text-white font-bold shadow-lg active:scale-95 transition-transform text-sm whitespace-nowrap ${b.color} ${b.isReal ? "ring-2 ring-white ring-offset-1" : ""}`}
            >
              {b.text}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
