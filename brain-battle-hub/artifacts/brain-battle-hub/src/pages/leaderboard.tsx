import { useState } from "react";
import { Layout } from "@/components/layout";
import { useGetLeaderboard, useGetPlayerRank } from "@workspace/api-client-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Trophy, Medal, Star } from "lucide-react";
import { useAppState } from "@/hooks/useAppState";
import { GAMES, getGameById } from "@/lib/games";

export default function Leaderboard() {
  const { username } = useAppState();
  const [period, setPeriod] = useState<"global" | "daily">("global");
  const [gameId, setGameId] = useState<string>("all");

  const { data: leaderboard, isLoading } = useGetLeaderboard({ 
    period, 
    gameId: gameId === "all" ? undefined : gameId,
    limit: 50
  }, { query: { queryKey: ["leaderboard", period, gameId] } });

  const { data: playerRank } = useGetPlayerRank(
    { username: username || "" },
    { query: { enabled: !!username, queryKey: ["playerRank", username] } }
  );

  return (
    <Layout>
      <div className="flex-1 bg-gray-50 flex flex-col">
        <div className="bg-white px-6 pt-10 pb-6 rounded-b-[32px] shadow-sm z-10 relative">
          <h1 className="text-3xl font-black text-gray-900 mb-6">Leaderboard</h1>
          
          <Tabs value={period} onValueChange={(v) => setPeriod(v as "global" | "daily")} className="w-full">
            <TabsList className="w-full h-12 bg-gray-100 rounded-2xl p-1 mb-4">
              <TabsTrigger value="global" className="flex-1 rounded-xl text-sm font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">All Time</TabsTrigger>
              <TabsTrigger value="daily" className="flex-1 rounded-xl text-sm font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Today</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 hide-scrollbar">
            <button
              onClick={() => setGameId("all")}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                gameId === "all" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500"
              }`}
            >
              All Games
            </button>
            {GAMES.map(g => (
              <button
                key={g.id}
                onClick={() => setGameId(g.id)}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap flex items-center gap-1.5 transition-colors ${
                  gameId === g.id ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500"
                }`}
              >
                <g.icon className="w-3.5 h-3.5" />
                {g.name}
              </button>
            ))}
          </div>

          {playerRank && (
            <div className="mt-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-4 text-white shadow-lg shadow-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-xs font-bold uppercase tracking-wider mb-1">Your Rank</p>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-black">#{playerRank.rank}</span>
                    <span className="text-sm text-purple-100 mb-1.5">/ {playerRank.totalPlayers}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="bg-white/20 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-1.5">
                    {playerRank.badge === "gold" && <Trophy className="w-4 h-4 text-yellow-400" />}
                    {playerRank.badge === "silver" && <Medal className="w-4 h-4 text-gray-300" />}
                    {playerRank.badge === "bronze" && <Star className="w-4 h-4 text-orange-400" />}
                    <span className="text-sm font-bold capitalize">{playerRank.badge}</span>
                  </div>
                  <p className="text-xs text-purple-100 mt-2 font-medium">Top {Math.round(playerRank.percentile)}%</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="flex flex-col gap-3 pb-8">
              {leaderboard?.map((entry, i) => {
                const game = getGameById(entry.gameId);
                const isMe = entry.username === username;
                
                return (
                  <div 
                    key={`${entry.username}-${entry.gameId}-${entry.score}-${i}`}
                    className={`flex items-center p-4 rounded-2xl bg-white shadow-sm border ${isMe ? 'border-primary shadow-primary/10' : 'border-gray-100'}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black mr-4 text-sm ${
                      i === 0 ? 'bg-yellow-100 text-yellow-600' :
                      i === 1 ? 'bg-gray-100 text-gray-500' :
                      i === 2 ? 'bg-orange-100 text-orange-600' :
                      'bg-gray-50 text-gray-400'
                    }`}>
                      {i + 1}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold truncate ${isMe ? 'text-primary' : 'text-gray-900'}`}>
                        {entry.username} {isMe && "(You)"}
                      </p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        {game && <game.icon className="w-3 h-3" />}
                        {game?.name || entry.gameId}
                      </p>
                    </div>
                    
                    <div className="font-black text-xl text-gray-900 ml-4">
                      {entry.score.toLocaleString()}
                    </div>
                  </div>
                );
              })}
              
              {leaderboard?.length === 0 && (
                <div className="text-center py-10 text-gray-400 font-medium">
                  No scores yet. Be the first!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
