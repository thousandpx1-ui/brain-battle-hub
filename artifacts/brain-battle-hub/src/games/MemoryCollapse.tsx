import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export function MemoryCollapse({
  onGameOver,
  onScoreChange,
}: {
  onGameOver: (score: number) => void;
  onScoreChange?: (score: number) => void;
}) {
  const [level, setLevel] = useState(1);
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerSequence, setPlayerSequence] = useState<number[]>([]);
  const [showingSequence, setShowingSequence] = useState(false);
  const [gridSize] = useState(16);

  useEffect(() => {
    startLevel(level);
    onScoreChange?.((level - 1) * 25 + 100);
  }, [level, onScoreChange]);

  const startLevel = (currentLevel: number) => {
    const numTiles = 2 + currentLevel; // Starts with 3 tiles
    const newSequence: number[] = [];
    
    while (newSequence.length < numTiles) {
      const rand = Math.floor(Math.random() * gridSize);
      if (!newSequence.includes(rand)) {
        newSequence.push(rand);
      }
    }
    
    setSequence(newSequence);
    setPlayerSequence([]);
    setShowingSequence(true);

    setTimeout(() => {
      setShowingSequence(false);
    }, 2500 + (currentLevel * 200)); // More time for higher levels
  };

  const handleTap = (index: number) => {
    if (showingSequence) return;

    const newPlayerSequence = [...playerSequence, index];
    setPlayerSequence(newPlayerSequence);

    const currentTapIndex = newPlayerSequence.length - 1;
    
    if (sequence[currentTapIndex] !== index) {
      // Wrong tap
      onGameOver((level - 1) * 25 + 100);
      return;
    }

    if (newPlayerSequence.length === sequence.length) {
      // Level complete
      setTimeout(() => {
        setLevel(level + 1);
      }, 500);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full max-w-sm mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold">Level {level}</h2>
        <p className="text-gray-500 mt-2">{showingSequence ? "Memorize!" : "Recall!"}</p>
      </div>

      <div className="grid grid-cols-4 gap-2 w-full aspect-square">
        {Array.from({ length: gridSize }).map((_, i) => {
          const sequenceIndex = sequence.indexOf(i);
          const isPartOfSequence = sequenceIndex !== -1;
          const isPlayerTapped = playerSequence.includes(i);
          
          let content = "";
          let bgClass = "bg-gray-100 hover:bg-gray-200 active:bg-gray-300";

          if (showingSequence && isPartOfSequence) {
            content = (sequenceIndex + 1).toString();
            bgClass = "bg-primary text-white";
          } else if (!showingSequence && isPlayerTapped) {
            content = (sequence.indexOf(i) + 1).toString();
            bgClass = "bg-green-500 text-white";
          }

          return (
            <button
              key={i}
              onClick={() => handleTap(i)}
              className={`rounded-xl text-2xl font-black transition-colors flex items-center justify-center ${bgClass}`}
              disabled={showingSequence || isPlayerTapped}
            >
              {content}
            </button>
          );
        })}
      </div>
    </div>
  );
}
