import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout";
import { GAMES } from "@/lib/games";
import { useAppState } from "@/hooks/useAppState";
import { useCoins } from "@/hooks/useCoins";
import { Flame, Play, Sparkles, Trophy, Medal } from "lucide-react";
import { UsernameModal } from "@/components/username-modal";
import { AdBanner } from "@/components/ad-banner";

import { getFullLeaderboard } from "@/lib/d1-client";
import { useLocalLeaderboard } from "@/lib/local-leaderboard";

function formatScore(score: number): string {
  const num = Math.floor(score);

  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }

  return num.toString();
}

export default function Home() {
  const { username, streak, updateStreak } = useAppState();
  const { coins } = useCoins();
  const [showUsername, setShowUsername] = useState(false);
  const [dailyLeaderboard, setDailyLeaderboard] = useState<Array<{username: string; score: number; createdAt?: string}>>([]);
  const [dailyLoading, setDailyLoading] = useState(true);
  const localScores = useLocalLeaderboard((s) => s.scores);
  const _version = useLocalLeaderboard((s) => s.version);
  
  // Force re-render check - v2.0.1
  console.log("Home loaded with", GAMES.length, "games");

  // Fetch daily leaderboard
  const fetchDailyLeaderboard = async () => {
    setDailyLoading(true);
    try {
      const data = await getFullLeaderboard('daily');

      // Always combine database data with local data
      const today = new Date().toDateString();
      const todayScores = localScores.filter(entry =>
        new Date(entry.createdAt).toDateString() === today
      );

      const totalScoreMap = new Map();

      // Compute local sums first (since local scores are individual runs)
      const localSumMap = new Map();
      for (const entry of todayScores) {
        const existing = localSumMap.get(entry.username);
        if (existing) {
          existing.score += entry.score;
        } else {
          localSumMap.set(entry.username, { ...entry });
        }
      }

      // Add database data first
      for (const entry of data) {
        totalScoreMap.set(entry.username, { ...entry });
      }

      // Merge local sums into totalScoreMap
      for (const [username, entry] of localSumMap.entries()) {
        const existing = totalScoreMap.get(username);
        if (existing) {
          // If the DB score is lagging behind the local sum, use the local sum
          // Note: we take the max because DB score already includes past runs!
          existing.score = Math.max(existing.score, entry.score);
        } else {
          totalScoreMap.set(username, { ...entry });
        }
      }

      const combinedData = Array.from(totalScoreMap.values()).sort((a, b) => b.score - a.score);
      const top5 = combinedData.slice(0, 5);
      setDailyLeaderboard(top5);
    } catch (error) {
      // Fallback to local only if database completely fails
      const today = new Date().toDateString();
      const todayScores = localScores.filter(entry =>
        new Date(entry.createdAt).toDateString() === today
      );

      const totalScoreMap = new Map();
      for (const entry of todayScores) {
        const existing = totalScoreMap.get(entry.username);
        if (existing) {
          existing.score += entry.score;
        } else {
          totalScoreMap.set(entry.username, { ...entry });
        }
      }
      const localData = Array.from(totalScoreMap.values()).sort((a, b) => b.score - a.score);
      const top5 = localData.slice(0, 5);
      setDailyLeaderboard(top5);
    } finally {
      setDailyLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyLeaderboard();

    // Auto-refresh daily leaderboard every 3 seconds
    const refreshTimer = setInterval(fetchDailyLeaderboard, 3000);
    return () => clearInterval(refreshTimer);
  }, [username, _version]); // Refetch when user changes or scores update

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



        {dailyLeaderboard.length > 0 ? (
          <div className="mt-4 bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                Today's Top Players
              </h3>
              <Link href="/leaderboard?period=daily" className="text-sm font-bold text-primary">View All</Link>
            </div>
            <div className="flex flex-col gap-3">
              {dailyLeaderboard.map((entry, i) => {
                const medal = i === 0 ? <Trophy className="w-4 h-4 text-yellow-500 fill-yellow-500" /> :
                              i === 1 ? <Medal className="w-4 h-4 text-gray-400" /> :
                              i === 2 ? <Medal className="w-4 h-4 text-amber-600" /> : null;
                return (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        i === 0 ? 'bg-yellow-100' :
                        i === 1 ? 'bg-gray-100' :
                        i === 2 ? 'bg-amber-100' :
                        'bg-gray-50'
                      }`}>
                        {medal || (
                          <span className="font-black text-xs text-gray-400">{i + 1}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-gray-900">{entry.username}</p>
                      </div>
                    </div>
                    <div className="font-black text-sm">{formatScore(entry.score)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mt-4 bg-white rounded-3xl p-5 shadow-sm border border-gray-100 text-center">
            <Trophy className="w-8 h-8 text-primary mx-auto mb-2 opacity-50" />
            <p className="text-gray-500 font-medium">No games played today yet</p>
            <p className="text-gray-400 text-sm mt-1">Top players will appear here after games are completed</p>
          </div>
        )}

        <div className="mt-4 -mx-6">
          <AdBanner />
        </div>
      </div>

      <UsernameModal open={showUsername} onOpenChange={setShowUsername} />
    </Layout>
  );
}
