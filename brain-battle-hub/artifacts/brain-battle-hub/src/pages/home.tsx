import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout";
import { GAMES } from "@/lib/games";
import { useAppState } from "@/hooks/useAppState";
import { Flame, Play, Sparkles, Trophy, Medal } from "lucide-react";
import { UsernameModal } from "@/components/username-modal";

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
  const [showUsername, setShowUsername] = useState(false);
  const [dailyLeaderboard, setDailyLeaderboard] = useState([]);
  const [dailyLoading, setDailyLoading] = useState(true);
  const localScores = useLocalLeaderboard((s) => s.scores);
  const _version = useLocalLeaderboard((s) => s.version);

  // Fetch daily leaderboard
  useEffect(() => {
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

        // Add database data first
        for (const entry of data) {
          totalScoreMap.set(entry.username, { ...entry });
        }

        // Add local data (will combine scores if user exists in both)
        for (const entry of todayScores) {
          const existing = totalScoreMap.get(entry.username);
          if (existing) {
            existing.score += entry.score;
          } else {
            totalScoreMap.set(entry.username, { ...entry });
          }
        }

        const combinedData = Array.from(totalScoreMap.values()).map(entry => ({
          ...entry,
          score: entry.username === username ? 100 : entry.score
        })).sort((a, b) => b.score - a.score);
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
        const localData = Array.from(totalScoreMap.values()).map(entry => ({
          ...entry,
          score: entry.username === username ? 100 : entry.score
        })).sort((a, b) => b.score - a.score);
        setDailyLeaderboard(localData);
      } finally {
        setDailyLoading(false);
      }
    };

    fetchDailyLeaderboard();
  }, [username]); // Refetch when user changes (after playing games)

  useEffect(() => {
    updateStreak();
    if (!username) {
      setShowUsername(true);
    }
  }, [updateStreak, username]);

  return (
    <Layout>
      <div className="flex-1 p-6 flex flex-col gap-6 pt-10">
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

        <div className="flex flex-col gap-4 mt-4">
          {GAMES.map((game, i) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link href={`/game/${game.id}`}>
                <div className={`${game.gradient} p-5 rounded-[24px] shadow-lg shadow-gray-200 text-white relative overflow-hidden group cursor-pointer`}>
                  <div className="absolute top-0 right-0 p-4 opacity-20 transform translate-x-4 -translate-y-4">
                    <game.icon className="w-24 h-24" />
                  </div>
                  
                  <div className="relative z-10">
                    <div className="bg-white/20 w-10 h-10 rounded-xl flex items-center justify-center mb-3 backdrop-blur-sm">
                      <game.icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-1">{game.name}</h3>
                    <p className="text-white/80 text-sm mb-4 leading-tight max-w-[85%]">{game.description}</p>
                    
                    <div className="bg-white/20 backdrop-blur-sm py-2 px-4 rounded-full inline-flex items-center gap-2 text-sm font-bold">
                      <Play className="w-4 h-4 fill-white" />
                      PLAY NOW
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
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

      </div>

      <UsernameModal open={showUsername} onOpenChange={setShowUsername} />
    </Layout>
  );
}
