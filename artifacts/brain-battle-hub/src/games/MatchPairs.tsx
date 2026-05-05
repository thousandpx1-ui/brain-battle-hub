import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";

const ALL_EMOJIS = [
  "🍎", "🍌", "🍒", "🍇", "🍉", "🍓", "🥝", "🍍", 
  "🥥", "🍋", "🍊", "🍑", "🍄", "🥕", "🌽", "🥦",
  "🍔", "🍕", "🍩", "🍦", "🌮", "🍣", "🍪", "🥑"
];

type GameState = "idle" | "playing" | "gameover" | "victory" | "level_complete";

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  rotation: number;
  color: string;
  delay: number;
}

export function MatchPairs({
  onGameOver,
  onScoreChange,
}: {
  onGameOver: (score: number) => void;
  onScoreChange?: (score: number) => void;
}) {
  const [level, setLevel] = useState<number>(1);
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number>(0);
  const [moves, setMoves] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(50);
  const [gameState, setGameState] = useState<GameState>("idle");
  const [score, setScore] = useState<number>(0);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sparkleIdRef = useRef(0);

  const getLevelConfig = useCallback((lvl: number) => {
    // lvl 1: 4 pairs, 30s
    // lvl 2: 6 pairs, 40s
    // lvl 3: 8 pairs, 50s
    // lvl 4: 10 pairs, 60s
    // lvl 5: 12 pairs, 70s
    // above lvl 5: 12 pairs, decreasing time
    const pairs = Math.min(4 + Math.floor((lvl - 1) / 1) * 2, 12);
    let time = 30 + (lvl - 1) * 10;
    if (lvl > 5) {
        time = Math.max(15, 70 - (lvl - 5) * 5);
    }
    return { pairs, time };
  }, []);

  const startLevel = useCallback((lvl: number) => {
    const { pairs, time } = getLevelConfig(lvl);
    // Shuffle emojis and pick required pairs
    const selectedEmojis = [...ALL_EMOJIS].sort(() => Math.random() - 0.5).slice(0, pairs);
    const shuffled = [...selectedEmojis, ...selectedEmojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false,
      }));
    setCards(shuffled);
    setFlippedIndices([]);
    setMatchedPairs(0);
    setMoves(0);
    setTimeLeft(time);
    setGameState("playing");
  }, [getLevelConfig]);

  const initGame = useCallback(() => {
    setLevel(1);
    setScore(0);
    startLevel(1);
  }, [startLevel]);

  useEffect(() => {
    if (gameState === "playing") {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setGameState("gameover");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  useEffect(() => {
    if (gameState === "gameover" || gameState === "victory") {
      onGameOver(score);
    }
  }, [gameState, score, onGameOver]);

  const generateSparkles = (x: number, y: number) => {
    const newSparkles: Sparkle[] = [];
    const color = "#ffeb3b"; // Yellow gold

    for (let i = 0; i < 12; i++) {
      sparkleIdRef.current += 1;
      newSparkles.push({
        id: sparkleIdRef.current,
        x: x + (Math.random() - 0.5) * 60,
        y: y + (Math.random() - 0.5) * 60,
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

  const handleCardClick = (index: number, event: React.MouseEvent) => {
    if (gameState !== "playing" || flippedIndices.length === 2 || cards[index].isFlipped || cards[index].isMatched) {
      return;
    }

    playPopSound();

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlippedIndices = [...flippedIndices, index];
    setFlippedIndices(newFlippedIndices);

    if (newFlippedIndices.length === 2) {
      setMoves((m) => m + 1);
      const [firstIndex, secondIndex] = newFlippedIndices;
      
      if (newCards[firstIndex].emoji === newCards[secondIndex].emoji) {
        // Match!
        setTimeout(() => {
          playMatchSound();
          const matchedCards = [...newCards];
          matchedCards[firstIndex].isMatched = true;
          matchedCards[secondIndex].isMatched = true;
          setCards(matchedCards);
          setFlippedIndices([]);
          setMatchedPairs((p) => {
            const newPairs = p + 1;
            // More points for higher levels
            const basePoints = 100;
            const levelMultiplier = 1 + (level - 1) * 0.5;
            const newScore = score + Math.floor(basePoints * levelMultiplier);
            setScore(newScore);
            onScoreChange?.(newScore);
            
            const { pairs } = getLevelConfig(level);
            if (newPairs === pairs) {
              setGameState("level_complete");
            }
            return newPairs;
          });
          setTimeLeft((t) => t + 2); // Add 2 seconds
          
          // Generate particles
          const rect = (event.target as HTMLElement).getBoundingClientRect();
          const parentRect = (event.target as HTMLElement).closest('.grid')?.getBoundingClientRect();
          if (parentRect) {
             const x = ((rect.left + rect.width / 2) - parentRect.left) / parentRect.width * 100;
             const y = ((rect.top + rect.height / 2) - parentRect.top) / parentRect.height * 100;
             generateSparkles(x, y);
          }
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          const resetCards = [...newCards];
          resetCards[firstIndex].isFlipped = false;
          resetCards[secondIndex].isFlipped = false;
          setCards(resetCards);
          setFlippedIndices([]);
        }, 1000);
      }
    }
  };

  const playPopSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e) {
      console.error(e);
    }
  };

  const playMatchSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.2);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full max-w-sm mx-auto p-4">
      {gameState === "idle" ? (
        <div className="text-center">
          <h2 className="text-3xl font-black mb-4">Match Pairs</h2>
          <p className="text-gray-500 mb-8">Find all matching pairs before time runs out!</p>
          <Button onClick={initGame} className="h-14 rounded-2xl text-lg font-bold w-full">
            Start Game
          </Button>
        </div>
      ) : (
        <>
          <div className="w-full flex justify-between items-center mb-6">
            <div className="text-center">
              <p className="text-xs text-gray-400 font-bold uppercase">Level</p>
              <p className="text-2xl font-black text-blue-500">{level}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 font-bold uppercase">Time</p>
              <p className={`text-2xl font-black ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : ''}`}>{timeLeft}s</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 font-bold uppercase">Moves</p>
              <p className="text-2xl font-black">{moves}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 font-bold uppercase">Pairs</p>
              <p className="text-2xl font-black text-primary">{matchedPairs}/{getLevelConfig(level).pairs}</p>
            </div>
          </div>

          <div className={`relative w-full max-w-[320px] grid ${getLevelConfig(level).pairs >= 10 ? 'grid-cols-5 gap-2' : 'grid-cols-4 gap-3'} mb-6 mx-auto`}>
            {cards.map((card, index) => (
              <div 
                key={card.id} 
                className="relative w-full aspect-square cursor-pointer perspective-[1000px]"
                onClick={(e) => handleCardClick(index, e)}
              >
                <div 
                  className="w-full h-full transition-transform duration-500 relative"
                  style={{ 
                    transformStyle: 'preserve-3d',
                    transform: card.isFlipped || card.isMatched ? 'rotateY(180deg)' : 'rotateY(0deg)'
                  }}
                >
                  {/* Front (Hidden state) */}
                  <div 
                    className="absolute inset-0 bg-primary rounded-xl flex items-center justify-center shadow-md border-2 border-primary/50"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <div className="w-8 h-8 rounded-full bg-white/20" />
                  </div>
                  {/* Back (Revealed state) */}
                  <div 
                    className={`absolute inset-0 bg-card border rounded-xl flex items-center justify-center shadow-md ${getLevelConfig(level).pairs >= 10 ? 'text-2xl' : 'text-4xl'} transition-all duration-300 ${
                      card.isMatched ? 'ring-4 ring-green-400 ring-opacity-50 shadow-[0_0_15px_rgba(74,222,128,0.5)] scale-105' : ''
                    }`}
                    style={{ 
                      backfaceVisibility: 'hidden', 
                      transform: 'rotateY(180deg)'
                    }}
                  >
                    {card.emoji}
                  </div>
                </div>
              </div>
            ))}
            {/* Sparkles overlay */}
            {sparkles.map((sparkle) => (
              <div
                key={sparkle.id}
                className="pointer-events-none absolute z-50"
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

          <Button onClick={initGame} variant="outline" className="h-12 rounded-xl font-bold w-full">
            Restart
          </Button>
        </>
      )}

      {(gameState === "gameover" || gameState === "victory" || gameState === "level_complete") && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-background p-8 rounded-3xl text-center w-[80%] max-w-sm border shadow-2xl">
            <h2 className={`text-3xl font-black mb-2 ${gameState === "level_complete" ? "text-blue-500" : gameState === "victory" ? "text-green-500" : "text-red-500"}`}>
              {gameState === "level_complete" ? "Level Complete!" : gameState === "victory" ? "You Won!" : "Time's Up!"}
            </h2>
            <div className="text-muted-foreground mb-6 space-y-1">
              <p>Level: <span className="font-bold text-foreground">{level}</span></p>
              <p>Moves: <span className="font-bold text-foreground">{moves}</span></p>
              <p>Pairs: <span className="font-bold text-foreground">{matchedPairs}/{getLevelConfig(level).pairs}</span></p>
              <p className="text-xl mt-2 text-primary font-black">Score: {score}</p>
            </div>
            {gameState === "level_complete" ? (
              <Button onClick={() => {
                const nextLevel = level + 1;
                setLevel(nextLevel);
                startLevel(nextLevel);
              }} className="h-12 w-full rounded-xl font-bold bg-blue-500 hover:bg-blue-600 text-white">
                Next Level
              </Button>
            ) : (
              <Button onClick={initGame} className="h-12 w-full rounded-xl font-bold">
                Play Again
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
