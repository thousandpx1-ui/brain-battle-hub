import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Coins } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { saveScore } from "@/lib/d1-client.js";
import { useAppState } from "@/hooks/useAppState";
import { useLocalLeaderboard } from "@/lib/local-leaderboard";

const MULTIPLIERS = [1.3, 1.5, 1.8, 2.0, 2.5, 3.0, 0.8, 1.0, 1.2]; // Better odds, fewer losses
const WIN_CHANCES = [0.55, 0.60, 0.65, 0.70, 0.75]; // Higher win rates

export function RiskOrSafe({ onGameOver }: { onGameOver: (score: number) => void }) {
  const { username } = useAppState();
  const addLocalScore = useLocalLeaderboard((s) => s.addScore);

  const [bank, setBank] = useState(100);
  const [round, setRound] = useState(1);
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState<"win" | "lose" | null>(null);
  const [multiplier, setMultiplier] = useState(2.0);
  const [consecutiveWins, setConsecutiveWins] = useState(0); // Track win streak for bonus
  const [safeUsedToday, setSafeUsedToday] = useState(false);

  // Check if safe was used today
  useEffect(() => {
    const today = new Date().toDateString();
    const lastSafeDate = localStorage.getItem('riskorsafe_safe_used');
    if (lastSafeDate === today) {
      setSafeUsedToday(true);
    }
  }, []);

  // Save current progress to leaderboard
  const saveProgress = async (currentScore: number) => {
    if (!username) {
      console.log('⚠️ RiskOrSafe: No username, skipping save');
      return;
    }

    try {
      console.log('💾 RiskOrSafe: Saving progress score:', currentScore, 'for user:', username);
      // Save to local leaderboard
      addLocalScore({ gameId: 'risk', username, score: currentScore });
      console.log('✅ RiskOrSafe: Saved to local leaderboard');
      // Save to Appwrite database
      await saveScore(currentScore, 'RiskOrSafe');
      console.log('✅ RiskOrSafe: Saved to database');
    } catch (error) {
      console.error('❌ RiskOrSafe: Failed to save progress:', error);
    }
  };

  const getWinChance = () => {
    return WIN_CHANCES[Math.floor(Math.random() * WIN_CHANCES.length)];
  };

  const getRandomMultiplier = () => {
    return MULTIPLIERS[Math.floor(Math.random() * MULTIPLIERS.length)];
  };

  const handleSafe = async () => {
    // Record that safe was used today
    const today = new Date().toDateString();
    localStorage.setItem('riskorsafe_safe_used', today);
    setSafeUsedToday(true);

    console.log('🛡️ RiskOrSafe: Using SAFE option with score:', bank);

    // Save the safe choice result
    await saveProgress(bank);

    onGameOver(bank);
  };

  const handleRisk = () => {
    setFlipping(true);
    setResult(null);

    const newMultiplier = getRandomMultiplier();
    const winChance = getWinChance();
    const isWin = Math.random() < winChance;

    setMultiplier(newMultiplier);

    setTimeout(() => {
      setFlipping(false);

      if (isWin) {
        const newBank = Math.floor(bank * newMultiplier);
        const winStreakBonus = Math.floor((consecutiveWins + 1) / 3) * 20; // Bonus every 3 consecutive wins
        const finalBank = newBank + winStreakBonus;
        
        setResult("win");
        setConsecutiveWins(c => c + 1);

        setTimeout(async () => {
          setBank(finalBank);
          setResult(null);

          // Save progress after each successful risk for real-time leaderboard updates
          await saveProgress(finalBank);

          if (round >= 8) {
            console.log('🎯 RiskOrSafe: Game completed with final score:', finalBank);
            onGameOver(finalBank);
          } else {
            console.log('🎲 RiskOrSafe: Round', round + 1, 'completed, current bank:', finalBank);
            setRound(r => r + 1);
          }
        }, 1000);
      } else {
        setResult("lose");
        setConsecutiveWins(0);

        setTimeout(async () => {
          // Don't lose everything - lose 50% instead
          const remainingBank = Math.floor(bank * 0.5);
          console.log('💥 RiskOrSafe: Game lost, final score:', remainingBank);

          // Save the loss result
          await saveProgress(remainingBank);

          onGameOver(remainingBank);
        }, 1000);
      }
    }, 1500);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full max-w-sm mx-auto">
      <div className="mb-8 text-center">
        <p className="text-gray-500 font-bold uppercase tracking-widest text-sm mb-2">Round {round} / 8</p>
        <h2 className="text-5xl font-black text-primary">{bank}</h2>
        <p className="text-gray-400 mt-2 font-medium">Banked Points</p>
        {consecutiveWins > 0 && (
          <p className="text-orange-500 font-bold mt-1">🔥 {consecutiveWins} win streak!</p>
        )}
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
          ) : result === "win" ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1.2 }}
              className="text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 0.5, repeat: 2 }}
                className="text-4xl font-black text-green-500"
              >
                x{multiplier}
              </motion.div>
              <p className="text-green-600 font-bold mt-2">WIN!</p>
            </motion.div>
          ) : result === "lose" ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1.2 }}
              className="text-center"
            >
              <motion.div
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 0.3, repeat: 3 }}
                className="text-4xl font-black text-red-500"
              >
                BUST!
              </motion.div>
              <p className="text-red-600 font-bold mt-2">Lost everything</p>
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
          disabled={flipping || result !== null || safeUsedToday}
          variant="outline"
          className={`h-16 text-lg font-bold border-2 ${safeUsedToday ? 'opacity-50' : ''}`}
        >
          SAFE
          <br/>
          <span className="text-xs font-normal text-gray-500">
            {safeUsedToday ? 'Used today' : `Keep ${bank}`}
          </span>
        </Button>
        <Button
          onClick={handleRisk}
          disabled={flipping || result !== null}
          className="h-16 text-lg font-bold"
        >
          RISK
          <br/>
          <span className="text-xs font-normal text-white/70">Random x0.5-x3.0</span>
        </Button>
      </div>
    </div>
  );
}
