import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout";
import { GAMES } from "@/lib/games";
import { useAppState } from "@/hooks/useAppState";
import { useCoins } from "@/hooks/useCoins";
import { Flame, Play, Sparkles } from "lucide-react";
import { UsernameModal } from "@/components/username-modal";
import { AdBanner } from "@/components/ad-banner";

import { useLocalLeaderboard } from "@/lib/local-leaderboard";

export default function Home() {
  const { username, streak, updateStreak } = useAppState();
  const { coins } = useCoins();
  const [showUsername, setShowUsername] = useState(false);
  const localScores = useLocalLeaderboard((s) => s.scores);

  useEffect(() => {
    updateStreak();
    if (!username) {
      setShowUsername(true);
    }
  }, [updateStreak, username]);

  return (
    <Layout>
      <div className="flex-1 p-6 flex flex-col gap-6 pt-10">
        <div className="flex items-center gap-2 -mb-2">
          <div className="bg-yellow-50 px-3 py-1.5 rounded-full flex items-center gap-1 border border-yellow-200">
            <span className="text-lg leading-none">🪙</span>
            <span className="font-bold text-yellow-700 text-sm">{coins.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              Brain Battle
              <Sparkles className="w-6 h-6 text-yellow-400 fill-yellow-400" />
            </h1>
            {username && <p className="text-gray-500 font-medium mt-1">Ready, {username}?</p>}
          </div>
          
          <div className="bg-orange-50 px-3 py-1.5 rounded-full flex items-center gap-1 border border-orange-100">
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
            <span className="font-bold text-orange-600 text-sm">{streak}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          {GAMES.map((game, i) => {
            const bestScore = localScores
              .filter(s => s.username === username && s.gameId === game.id)
              .reduce((max, s) => Math.max(max, s.score), 0);

            return (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link href={`/game/${game.id}`}>
                <div className={`${game.gradient} p-4 rounded-[20px] shadow-sm shadow-gray-200 text-white relative overflow-hidden group cursor-pointer h-full flex flex-col`}>
                  <div className="absolute top-0 right-0 p-3 opacity-20 transform translate-x-2 -translate-y-2">
                    <game.icon className="w-16 h-16" />
                  </div>
                  
                  <div className="relative z-10 flex-1 flex flex-col">
                    <div className="bg-white/20 w-8 h-8 rounded-lg flex items-center justify-center mb-2 backdrop-blur-sm">
                      <game.icon className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-base font-bold mb-1 leading-tight">{game.name}</h3>
                    <div className="flex-1"></div>
                    
                    <div className="mt-3 bg-black/10 backdrop-blur-sm py-1.5 px-3 rounded-xl flex items-center justify-between w-full">
                      <div className="flex flex-col">
                        <span className="text-white/70 text-[9px] uppercase tracking-wider font-extrabold">Best Score</span>
                        <span className="font-black text-sm leading-none mt-0.5">{bestScore.toLocaleString()}</span>
                      </div>
                      <Play className="w-4 h-4 fill-white opacity-80" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          )})}
        </div>



        <div className="mt-4 -mx-6">
          <AdBanner />
        </div>
      </div>

      <UsernameModal open={showUsername} onOpenChange={setShowUsername} />
    </Layout>
  );
}
