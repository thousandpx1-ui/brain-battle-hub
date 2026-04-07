import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

const RIDDLES = [
  { q: "What has keys but can't open locks?", opts: ["Piano", "Map", "Door", "Code"], ans: 0 },
  { q: "What has a head and a tail but no body?", opts: ["Coin", "Snake", "Arrow", "Worm"], ans: 0 },
  { q: "I am tall when I'm young, and I'm short when I'm old.", opts: ["Tree", "Candle", "Man", "Shadow"], ans: 1 },
  { q: "What goes up but never comes down?", opts: ["Balloon", "Age", "Smoke", "Bird"], ans: 1 },
  { q: "The more of this there is, the less you see.", opts: ["Darkness", "Light", "Fog", "Distance"], ans: 0 },
  { q: "What has hands but cannot clap?", opts: ["Clock", "Statue", "Robot", "Monkey"], ans: 0 },
  { q: "What has many teeth, but cannot bite?", opts: ["Comb", "Gear", "Saw", "Zipper"], ans: 0 },
  { q: "What can you catch, but not throw?", opts: ["Cold", "Ball", "Frisbee", "Boomerang"], ans: 0 },
  { q: "What has one eye, but can't see?", opts: ["Needle", "Storm", "Potato", "Bat"], ans: 0 },
  { q: "What begins with T, ends with T, and has T in it?", opts: ["Teapot", "Tent", "Tentacle", "Toast"], ans: 0 },
];

export function IllusionFinder({ onGameOver }: { onGameOver: (score: number) => void }) {
  const [score, setScore] = useState(0);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  
  useEffect(() => {
    if (timeLeft <= 0) {
      onGameOver(score);
      return;
    }
    const t = setInterval(() => setTimeLeft(l => l - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft, score, onGameOver]);

  const handleAnswer = (optIdx: number) => {
    if (optIdx === RIDDLES[currentIdx].ans) {
      const earned = Math.max(1, 10 - (10 - timeLeft)); // Max 10, minus elapsed
      setScore(s => s + earned);
      
      if (currentIdx + 1 >= RIDDLES.length) {
        onGameOver(score + earned);
      } else {
        setCurrentIdx(i => i + 1);
        setTimeLeft(10);
      }
    } else {
      onGameOver(score);
    }
  };

  const riddle = RIDDLES[currentIdx];

  return (
    <div className="flex flex-col items-center justify-center w-full h-full max-w-sm mx-auto">
      <div className="flex justify-between w-full mb-8">
        <div className="font-bold text-gray-500">Score: {score}</div>
        <div className={`font-bold ${timeLeft <= 3 ? 'text-red-500 animate-pulse' : 'text-primary'}`}>
          {timeLeft}s
        </div>
      </div>

      <div className="text-center mb-10 min-h-[120px] flex items-center justify-center">
        <h2 className="text-2xl font-bold leading-snug">{riddle?.q}</h2>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full">
        {riddle?.opts.map((opt, i) => (
          <Button
            key={i}
            onClick={() => handleAnswer(i)}
            variant="outline"
            className="h-16 text-lg font-medium bg-gray-50 border-gray-200 hover:bg-primary hover:text-white"
          >
            {opt}
          </Button>
        ))}
      </div>
    </div>
  );
}
