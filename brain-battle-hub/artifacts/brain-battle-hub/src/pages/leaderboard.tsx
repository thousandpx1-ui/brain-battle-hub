import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Star, Medal } from "lucide-react";
import { useAppState } from "@/hooks/useAppState";
import { getFullLeaderboard, seedLeaderboard } from "@/lib/appwrite.js";
import { useLocalLeaderboard } from "@/lib/local-leaderboard";

function getTimeUntilMidnight(): string {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight.getTime() - now.getTime();

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function isToday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  return date.toDateString() === now.toDateString();
}

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

// Test cases for formatScore:
// formatScore(500) = "500"
// formatScore(1000) = "1k"
// formatScore(1200) = "1.2k"
// formatScore(1500) = "1.5k"
// formatScore(1000000) = "1M"
// formatScore(1200000) = "1.2M"
// formatScore(1000000000) = "1B"

export default function Leaderboard() {
  const { username } = useAppState();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const localScores = useLocalLeaderboard((s) => s.scores); // Fallback
  const _version = useLocalLeaderboard((s) => s.version);
  const [period, setPeriod] = useState<"global" | "daily">("global");
  const [timeLeft, setTimeLeft] = useState(getTimeUntilMidnight());
  const [, setTick] = useState(0);

  // Fetch leaderboard from Appwrite
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        // Try to seed first (will skip if already seeded)
        await seedLeaderboard();

        const data = await getFullLeaderboard(period);
        setLeaderboard(data);
      } catch (error) {
        console.error('Appwrite fetch failed, using local:', error);
        // Fallback to local (cumulative scoring logic)
        const allRawScores = period === "daily"
          ? localScores.filter(entry => isToday(entry.createdAt))
          : [...localScores];

        const totalScoreMap = new Map();
        for (const entry of allRawScores) {
          const existing = totalScoreMap.get(entry.username);
          if (existing) {
            existing.score += entry.score;
          } else {
            totalScoreMap.set(entry.username, { ...entry });
          }
        }
        setLeaderboard(Array.from(totalScoreMap.values()).sort((a, b) => b.score - a.score));
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchLeaderboard();
    }
  }, [period, username, _version]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeUntilMidnight());
      setTick(t => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []); 

  const filteredLeaderboard = leaderboard;

  // Player rank from remote/local data (cumulative scoring)
  const playerScores = localScores.filter(s => s.username === username);
  const playerTotalScore = period === "daily"
    ? playerScores.filter(s => isToday(s.createdAt)).reduce((sum, s) => sum + s.score, 0)
    : playerScores.reduce((sum, s) => sum + s.score, 0);

  const playerRank = playerTotalScore > 0 ? filteredLeaderboard.findIndex(entry => entry.username === username) + 1 : 0;
  const totalPlayers = filteredLeaderboard.length;
  const percentile = totalPlayers > 0 && playerRank > 0 ? ((totalPlayers - playerRank) / totalPlayers) * 100 : 0;
  const badge = percentile >= 90 ? "gold" : percentile >= 75 ? "silver" : "bronze";

  return (
    <Layout>
      <div className="flex-1 bg-gray-50 flex flex-col">
        <div className="bg-white px-6 pt-10 pb-6 rounded-b-[32px] shadow-sm z-10 relative">
          <h1 className="text-3xl font-black text-gray-900 mb-6">Leaderboard</h1>

          <Tabs value={period} onValueChange={(v) => setPeriod(v as "global" | "daily")} className="w-full">
            <TabsList className="w-full h-12 bg-gray-100 rounded-2xl p-1 mb-2">
              <TabsTrigger value="global" className="flex-1 rounded-xl text-sm font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">All Time</TabsTrigger>
              <TabsTrigger value="daily" className="flex-1 rounded-xl text-sm font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Today</TabsTrigger>
            </TabsList>
          </Tabs>

          {period === "daily" && (
            <div className="text-center text-xs text-gray-500 font-medium mb-4">
              Resets in <span className="font-mono font-bold text-primary">{timeLeft}</span>
            </div>
          )}

          {username && playerTotalScore > 0 && (
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
            {filteredLeaderboard.map((entry, i) => {
              const isMe = entry.username === username;
              const medalEmoji = i === 0 ? "🥇" :
                                 i === 1 ? "🥈" :
                                 i === 2 ? "🥉" : null;

              return (
                <div
                  key={`${entry.username}-${entry.gameId}-${entry.score}-${i}`}
                  className={`flex items-center p-4 rounded-2xl bg-white shadow-sm border ${isMe ? 'border-primary shadow-primary/10 ring-2 ring-primary/20' : 'border-gray-100'}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                    i === 0 ? 'bg-yellow-100' :
                    i === 1 ? 'bg-gray-100' :
                    i === 2 ? 'bg-amber-100' :
                    'bg-gray-50'
                  }`}>
                    {medalEmoji ? (
                      <span className="text-2xl">{medalEmoji}</span>
                    ) : (
                      <span className="font-black text-sm text-gray-400">{i + 1}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`font-bold truncate ${isMe ? 'text-primary' : 'text-gray-900'}`}>
                      {entry.username} {isMe && "(You)"}
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
            ) : filteredLeaderboard.length === 0 && (
              <div className="text-center py-10 text-gray-400 font-medium">
                No scores yet. Be the first!
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
