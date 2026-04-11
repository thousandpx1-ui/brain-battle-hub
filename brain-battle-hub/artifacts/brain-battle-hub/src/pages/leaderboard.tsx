import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Star } from "lucide-react";
import { useAppState } from "@/hooks/useAppState";

import { loadLeaderboardRealtime } from "@/lib/realtime-leaderboard";

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

export default function Leaderboard() {
  const { username, profileImage, profileFrame, oldUsernames, userId } = useAppState();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);


  // Load leaderboard
  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const players = await loadLeaderboardRealtime();
      setLeaderboard(players);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadLeaderboard();
  }, []);

  // Auto-refresh every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadLeaderboard();
    }, 2000);

    return () => clearInterval(interval);
  }, []);



 

  // Player rank
  const playerEntry = leaderboard.find(entry => entry.userId === userId);
  const playerTotalScore = playerEntry ? playerEntry.score : 0;
  const playerRank = playerEntry ? leaderboard.indexOf(playerEntry) + 1 : 0;
  const totalPlayers = leaderboard.length;
  const percentile = totalPlayers > 0 && playerRank > 0 ? ((totalPlayers - playerRank) / totalPlayers) * 100 : 0;
  const badge = percentile >= 90 ? "gold" : percentile >= 75 ? "silver" : "bronze";

  return (
    <Layout>
      <div className="flex-1 bg-gray-50 flex flex-col">
        <div className="bg-white px-6 pt-10 pb-6 rounded-b-[32px] shadow-sm z-10 relative">
          <h1 className="text-3xl font-black text-gray-900 mb-6">Leaderboard</h1>

          <div className="text-center text-sm text-gray-500 font-medium mb-4">
            Real-time Leaderboard
          </div>

          {userId && playerTotalScore > 0 && (
            <div className="mt-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-4 text-white shadow-lg shadow-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-xs font-bold uppercase tracking-wider mb-1">Your Rank</p>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-black">#{playerRank}</span>
                    <span className="text-sm text-purple-100 mb-1.5">/ {totalPlayers}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="bg-white/20 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-1.5">
                    {badge === "gold" && <Trophy className="w-4 h-4 text-yellow-400" />}
                    {badge === "silver" && <Star className="w-4 h-4 text-gray-300" />}
                    {badge === "bronze" && <Star className="w-4 h-4 text-orange-400" />}
                    <span className="text-sm font-bold capitalize">{badge}</span>
                  </div>
                  <p className="text-xs text-purple-100 mt-2 font-medium">Top {Math.round(percentile)}%</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="flex flex-col gap-3 pb-8">
            {leaderboard.map((entry, i) => {
              const isMe = entry.userId === userId;
              const medalEmoji = i === 0 ? "🥇" :
                                  i === 1 ? "🥈" :
                                  i === 2 ? "🥉" : null;

              return (
                <div
                  key={`${entry.userId}-${entry.score}-${i}`}
                  className={`flex items-center p-4 rounded-2xl bg-white shadow-sm border ${isMe ? 'border-primary shadow-primary/10 ring-2 ring-primary/20' : 'border-gray-100'}`}
                >
                  <Avatar className={`w-10 h-10 mr-4 border-2 ${isMe ? 'border-primary' : 'border-gray-200'}`}>
                    <AvatarFallback className={`rounded-full flex items-center justify-center ${
                      i === 0 ? 'bg-yellow-100' :
                      i === 1 ? 'bg-gray-100' :
                      i === 2 ? 'bg-amber-100' :
                      'bg-gray-50'
                    }`}>
                      {medalEmoji ? (
                        <span className="text-2xl">{medalEmoji}</span>
                      ) : (
                        <span className="font-black text-sm text-gray-400">{entry.userId.charAt(0).toUpperCase()}</span>
                      )}
                    </AvatarFallback>
                  </Avatar>

                   <div className="flex-1 min-w-0">
                     <p className={`font-bold truncate ${isMe ? 'text-primary' : 'text-gray-900'}`}>
                       {entry.userId} {isMe && "(You)"}
                     </p>
                   </div>

                  <div className="font-black text-xl text-gray-900 ml-4">
                    {formatScore(entry.score)}
                  </div>
                </div>
              );
            })}

{loading ? (
              <div className="flex items-center justify-center h-32 text-gray-400">
                Loading leaderboard...
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-10 text-gray-400 font-medium">
                No scores yet. Play some games to see your ranking!
                <br />
                <small className="text-gray-300 mt-2 block">
                  Scores will appear here after you complete games.
                </small>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </Layout>
  );
}
