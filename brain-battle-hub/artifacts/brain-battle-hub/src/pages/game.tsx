import { useState } from "react";
import { useParams, Link } from "wouter";
import { Layout } from "@/components/layout";
import { getGameById } from "@/lib/games";
import { Button } from "@/components/ui/button";
import { MemoryCollapse } from "@/games/MemoryCollapse";
import { DontBlink } from "@/games/DontBlink";
import { FakeTapTrap } from "@/games/FakeTapTrap";
import { IllusionFinder } from "@/games/IllusionFinder";
import { RiskOrSafe } from "@/games/RiskOrSafe";

import { saveScore } from "@/lib/d1-client";
import { saveScoreRealtime } from "@/lib/realtime-leaderboard";
import { useAppState } from "@/hooks/useAppState";
import { useLocalLeaderboard } from "@/lib/local-leaderboard";
import { InterstitialAd } from "@/components/interstitial-ad";
import { RewardAd } from "@/components/reward-ad";
import { Trophy, RotateCcw, Play, ChevronLeft } from "lucide-react";

type GameState = "start" | "playing" | "gameover";

export default function Game() {
  const { gameId } = useParams();
  const game = getGameById(gameId || "");
  const [gameState, setGameState] = useState<GameState>("start");
  const [score, setScore] = useState(0);
  const { username, profileFrame, gamesPlayedSession, incrementGamesPlayed, resetGamesPlayedSession, userId } = useAppState();
  const addLocalScore = useLocalLeaderboard((s) => s.addScore);

  const [showInterstitial, setShowInterstitial] = useState(false);
  const [showRewardAd, setShowRewardAd] = useState(false);

  if (!game) return <div>Game not found</div>;

  const handleStart = () => setGameState("playing");

  const handleGameOver = async (finalScore: number) => {
    console.log('💾 Game Over - Saving score:', finalScore, 'for game:', game.name, 'user:', username);
    setScore(finalScore);
    setGameState("gameover");
    incrementGamesPlayed();

    // Always save to local leaderboard
    if (username) {
      console.log('💾 Saving to local leaderboard:', { gameId: game.id, username, score: finalScore });
      addLocalScore({ gameId: game.id, username, score: finalScore });
      console.log('✅ Saved to local leaderboard');
    }

    // Save to real-time leaderboard (use username as userId)
    try {
      const saveName = username || "player";
      console.log('💾 Saving to real-time leaderboard:', { userId: saveName, score: finalScore });
      await saveScoreRealtime(finalScore, saveName);
      console.log('✅ Score saved to real-time leaderboard');
    } catch (error) {
      console.error('❌ Failed to save to real-time leaderboard:', error);
    }

    // Save to Appwrite database
    try {
      console.log('💾 Attempting to save to Appwrite database...');
      await saveScore(finalScore, username, profileFrame);
      console.log('✅ Score saved to database successfully');
    } catch (error) {
      console.error('❌ Failed to save score to database:', error);
      console.log('🔄 Score will only appear in local leaderboard');
    }

    if (gamesPlayedSession > 0 && gamesPlayedSession % 3 === 0) {
      setShowInterstitial(true);
    }
  };

  const handleRetry = () => {
    setGameState("start");
    setScore(0);
  };

  const handleRewardDouble = () => {
    setShowRewardAd(true);
  };

  const onRewardComplete = async () => {
    setShowRewardAd(false);
    const doubled = score * 2;
    setScore(doubled);
    if (username) {
      addLocalScore({ gameId: game.id, username, score: doubled });
      await saveScoreRealtime(doubled, username);
      await saveScore(doubled, username, profileFrame);
    }
  };

  const renderGameComponent = () => {
    switch (game.id) {
      case "memory": return <MemoryCollapse onGameOver={handleGameOver} />;
      case "blink": return <DontBlink onGameOver={handleGameOver} />;
      case "taptrap": return <FakeTapTrap onGameOver={handleGameOver} />;
      case "illusion": return <IllusionFinder onGameOver={handleGameOver} />;
      case "risk": return <RiskOrSafe onGameOver={handleGameOver} />;
      default: return <div>Unknown Game</div>;
    }
  };

  return (
    <Layout>
      <div className={`flex-1 flex flex-col ${gameState === 'playing' ? 'bg-white' : 'bg-gray-50'}`}>
        {/* Header */}
        <div className="flex items-center p-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ChevronLeft className="w-6 h-6" />
            </Button>
          </Link>
          <h1 className="flex-1 text-center font-bold text-lg">{game.name}</h1>
          <div className="w-10" /> {/* Balance */}
        </div>

        <div className="flex-1 p-6 flex flex-col items-center justify-center relative">
          {gameState === "start" && (
            <div className="w-full max-w-sm flex flex-col items-center text-center">
              <div className={`w-32 h-32 rounded-[32px] ${game.gradient} flex items-center justify-center shadow-xl shadow-gray-200 mb-8`}>
                <game.icon className="w-16 h-16 text-white" />
              </div>
              <h2 className="text-3xl font-black mb-4">{game.name}</h2>
              <p className="text-gray-500 mb-10">{game.description}</p>
              
              <Button onClick={handleStart} className="w-full h-14 rounded-2xl text-lg font-bold flex items-center gap-2">
                <Play className="w-5 h-5 fill-white" />
                PLAY NOW
              </Button>
            </div>
          )}

          {gameState === "playing" && (
            <div className="w-full flex-1">
              {renderGameComponent()}
            </div>
          )}

          {gameState === "gameover" && (
            <div className="w-full max-w-sm flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
              <div className="bg-white p-8 rounded-[32px] shadow-xl shadow-gray-100 w-full mb-6 border border-gray-100">
                <p className="text-gray-400 font-bold uppercase tracking-widest text-sm mb-2">Final Score</p>
                <h2 className="text-6xl font-black text-primary">{score}</h2>
              </div>
              
              <div className="flex flex-col gap-3 w-full">
                <Button onClick={handleRewardDouble} variant="outline" className="h-14 rounded-2xl text-lg font-bold border-2 border-purple-200 text-purple-600 bg-purple-50 hover:bg-purple-100">
                  <Play className="w-5 h-5 mr-2 fill-current" />
                  Watch Ad to 2x Score
                </Button>
                
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <Button onClick={handleRetry} variant="outline" className="h-14 rounded-2xl text-lg font-bold">
                    <RotateCcw className="w-5 h-5 mr-2" />
                    Retry
                  </Button>
                  <Link href="/leaderboard" className="contents">
                    <Button className="h-14 rounded-2xl text-lg font-bold">
                      <Trophy className="w-5 h-5 mr-2" />
                      Rank
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <InterstitialAd open={showInterstitial} onOpenChange={setShowInterstitial} />
      <RewardAd open={showRewardAd} onReward={onRewardComplete} onCancel={() => setShowRewardAd(false)} />
    </Layout>
  );
}
