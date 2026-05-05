import { Link } from "wouter";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout";
import { GAMES } from "@/lib/games";
import { Play, Sparkles } from "lucide-react";
import { useAppState } from "@/hooks/useAppState";
import { useLocalLeaderboard } from "@/lib/local-leaderboard";

export default function Games() {
  const { username } = useAppState();
  const localScores = useLocalLeaderboard((s) => s.scores);

  return (
    <Layout>
      <div className="flex-1 bg-gray-50 flex flex-col">
        <div className="bg-white px-6 pt-10 pb-6 rounded-b-[32px] shadow-sm z-10 relative">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-black text-gray-900">All Games</h1>
            <Sparkles className="w-6 h-6 text-yellow-400 fill-yellow-400" />
          </div>
          <p className="text-gray-500 font-medium">
            Choose from {GAMES.length} brain games and start playing.
          </p>
        </div>

        <div className="flex-1 p-6">
          <div className="grid grid-cols-2 gap-3">
            {GAMES.map((game, i) => {
              const bestScore = localScores
                .filter(s => s.username === username && s.gameId === game.id)
                .reduce((max, s) => Math.max(max, s.score), 0);

              return (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
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
        </div>
      </div>
    </Layout>
  );
}
