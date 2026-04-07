import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Coins } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function RiskOrSafe({ onGameOver }: { onGameOver: (score: number) => void }) {
  const [bank, setBank] = useState(100); // Start with 100
  const [round, setRound] = useState(1);
  const [flipping, setFlipping] = useState(false);

  const handleSafe = () => {
    onGameOver(bank);
  };

  const handleRisk = () => {
    setFlipping(true);
    
    setTimeout(() => {
      setFlipping(false);
      const isWin = Math.random() > 0.5;
      
      if (isWin) {
        setBank(bank * 2);
        if (round >= 8) {
          onGameOver(bank * 2);
        } else {
          setRound(r => r + 1);
        }
      } else {
        onGameOver(0);
      }
    }, 1500); // 1.5s flip animation
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full max-w-sm mx-auto">
      <div className="mb-8 text-center">
        <p className="text-gray-500 font-bold uppercase tracking-widest text-sm mb-2">Round {round} / 8</p>
        <h2 className="text-5xl font-black text-primary">{bank}</h2>
        <p className="text-gray-400 mt-2 font-medium">Banked Points</p>
      </div>

      <div className="h-40 flex items-center justify-center mb-10">
        <AnimatePresence>
          {flipping ? (
            <motion.div
              animate={{ rotateY: 360 * 5 }}
              transition={{ duration: 1.5, ease: "linear" }}
              className="w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg border-4 border-yellow-500"
            >
              <Coins className="w-12 h-12 text-yellow-100" />
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg border-4 border-yellow-500"
            >
              <Coins className="w-12 h-12 text-yellow-100" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full">
        <Button
          onClick={handleSafe}
          disabled={flipping}
          variant="outline"
          className="h-16 text-lg font-bold border-2"
        >
          SAFE
          <br/>
          <span className="text-xs font-normal text-gray-500">Keep {bank}</span>
        </Button>
        <Button
          onClick={handleRisk}
          disabled={flipping}
          className="h-16 text-lg font-bold"
        >
          RISK
          <br/>
          <span className="text-xs font-normal text-white/70">Win {bank * 2} or 0</span>
        </Button>
      </div>
    </div>
  );
}
