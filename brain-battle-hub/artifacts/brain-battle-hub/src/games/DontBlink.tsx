import { useState, useEffect, useRef } from "react";

export function DontBlink({ onGameOver }: { onGameOver: (score: number) => void }) {
  const [score, setScore] = useState(0);
  const [barPosition, setBarPosition] = useState(0);
  const [direction, setDirection] = useState(1);
  const [speed, setSpeed] = useState(2); // Initial speed
  const requestRef = useRef<number>();
  const isPlayingRef = useRef(true);

  // Define zones (0 to 100)
  const perfectZone = { min: 45, max: 55 };
  const goodZone = { min: 35, max: 65 };

  useEffect(() => {
    const animate = () => {
      if (!isPlayingRef.current) return;

      setBarPosition((prev) => {
        let next = prev + speed * direction;
        if (next >= 100) {
          setDirection(-1);
          return 100;
        }
        if (next <= 0) {
          setDirection(1);
          return 0;
        }
        return next;
      });
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [speed, direction]);

  const handleTap = () => {
    isPlayingRef.current = false;
    if (requestRef.current) cancelAnimationFrame(requestRef.current);

    if (barPosition >= perfectZone.min && barPosition <= perfectZone.max) {
      // Perfect
      const newScore = score + 20;
      setScore(newScore);
      setTimeout(() => nextRound(), 1000);
    } else if (barPosition >= goodZone.min && barPosition <= goodZone.max) {
      // Good
      const newScore = score + 10;
      setScore(newScore);
      setTimeout(() => nextRound(), 1000);
    } else {
      // Miss - Game Over
      setTimeout(() => onGameOver(score), 1000);
    }
  };

  const nextRound = () => {
    setSpeed((s) => s + 0.5);
    setBarPosition(0);
    setDirection(1);
    isPlayingRef.current = true;
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full" onClick={handleTap}>
      <div className="mb-12 text-center pointer-events-none">
        <h2 className="text-3xl font-black">{score}</h2>
        <p className="text-gray-500 mt-2">Tap to stop in the blue zone!</p>
      </div>

      <div className="w-full max-w-sm h-12 bg-gray-200 rounded-full relative overflow-hidden pointer-events-none">
        {/* Good Zone */}
        <div 
          className="absolute h-full bg-blue-200" 
          style={{ left: `${goodZone.min}%`, width: `${goodZone.max - goodZone.min}%` }} 
        />
        {/* Perfect Zone */}
        <div 
          className="absolute h-full bg-blue-500" 
          style={{ left: `${perfectZone.min}%`, width: `${perfectZone.max - perfectZone.min}%` }} 
        />
        
        {/* The moving bar */}
        <div 
          className="absolute top-0 bottom-0 w-2 bg-gray-900 rounded-full transition-none shadow-lg z-10"
          style={{ left: `calc(${barPosition}% - 4px)` }}
        />
      </div>
      
      <div className="mt-20 text-gray-400 text-sm uppercase tracking-widest font-bold pointer-events-none">
        Tap anywhere
      </div>
    </div>
  );
}
