import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useParams, Link } from "wouter";
import { Layout } from "@/components/layout";
import { getGameById } from "@/lib/games";
import { Button } from "@/components/ui/button";
import { MemoryCollapse } from "@/games/MemoryCollapse";
import { DontBlink } from "@/games/DontBlink";
import { FakeTapTrap } from "@/games/FakeTapTrap";
import { IllusionFinder } from "@/games/IllusionFinder";
import { SimonSays } from "@/games/SimonSays";
import { ColorBlast } from "@/games/ColorBlast";
import { MatchPairs } from "@/games/MatchPairs";
import { NeonBounce } from "@/games/NeonBounce";
import { FruitSlice } from "@/games/FruitSlice";

import { saveScoreRealtime } from "@/lib/realtime-leaderboard";
import { useAppState } from "@/hooks/useAppState";
import { useCoins } from "@/hooks/useCoins";
import { useLocalLeaderboard } from "@/lib/local-leaderboard";
import { InterstitialAd } from "@/components/interstitial-ad";
import { Trophy, RotateCcw, Play, ChevronLeft, Share2 } from "lucide-react";

type GameState = "start" | "playing" | "gameover";

export default function Game() {
  const [, setLocation] = useLocation();
  const { gameId } = useParams();
  const game = getGameById(gameId || "");
  const [gameState, setGameState] = useState<GameState>("start");
  const [score, setScore] = useState(0);
  const {
    username,
    profileFrame,
    profileImage,
    userId,
  } = useAppState();
  const { addReward } = useCoins();
  const addLocalScore = useLocalLeaderboard((s) => s.addScore);
  const localScores = useLocalLeaderboard((s) => s.scores);

  const bestScore = Math.max(
    localScores
      .filter((s) => s.gameId === game?.id && s.username === username)
      .reduce((max, s) => Math.max(max, s.score), 0),
    score
  );

  const [showInterstitial, setShowInterstitial] = useState(false);
  const [hasDoubled, setHasDoubled] = useState(false);
  const [scoreSavedInPlay, setScoreSavedInPlay] = useState(false);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [copied, setCopied] = useState(false);

  const latestScoreRef = useRef(0);
  const lastPersistedScoreRef = useRef(0);
  const gameStateRef = useRef<GameState>("start");
  const hasCountedGameRef = useRef(false);

  if (!game) return <div>Game not found</div>;

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const persistRunScore = useCallback(
    async (scoreToPersist: number) => {
      if (!game || scoreToPersist <= lastPersistedScoreRef.current)
        return false;

      console.log(
        "💾 Saving score:",
        scoreToPersist,
        "for game:",
        game.name,
        "user:",
        username,
      );

      if (username) {
        console.log("💾 Saving to local leaderboard:", {
          gameId: game.id,
          username,
          score: scoreToPersist,
        });
        addLocalScore({ gameId: game.id, username, score: scoreToPersist });
        console.log("✅ Saved to local leaderboard");
      }

      try {
        const saveName = username || "player";
        console.log("💾 Saving to real-time leaderboard:", {
          userId: userId,
          score: scoreToPersist,
          profileFrame,
        });
        const result = await saveScoreRealtime(scoreToPersist, userId, saveName, profileFrame, profileImage);
        console.log("✅ Score saved to real-time leaderboard");
        
        lastPersistedScoreRef.current = scoreToPersist;
        return result;
      } catch (error) {
        console.error("❌ Failed to save to real-time leaderboard:", error);
      }

      lastPersistedScoreRef.current = scoreToPersist;
      return true;
    },
    [addLocalScore, game, profileFrame, profileImage, userId, username],
  );

  const persistRunScoreSync = useCallback(
    (scoreToPersist: number) => {
      if (!game || scoreToPersist <= lastPersistedScoreRef.current) return;

      if (username) {
        addLocalScore({ gameId: game.id, username, score: scoreToPersist });
      }

      try {
        const saveName = username || "player";
        saveScoreRealtime(scoreToPersist, userId, saveName, profileFrame, profileImage).catch((err) =>
          console.error("Failed to save realtime score on back:", err),
        );
      } catch (error) {
        console.error("Failed to save realtime score on back:", error);
      }

      lastPersistedScoreRef.current = scoreToPersist;
    },
    [addLocalScore, game, profileFrame, profileImage, userId, username],
  );

  const handleStart = () => {
    latestScoreRef.current = 0;
    lastPersistedScoreRef.current = 0;
    hasCountedGameRef.current = false;
    setScore(0);
    setGameState("playing");
    setScoreSavedInPlay(false);
    setHasDoubled(false);
    setEarnedCoins(0);
  };

  const handleScoreChange = (nextScore: number) => {
    const normalizedScore = Math.max(0, Math.floor(nextScore));
    latestScoreRef.current = Math.max(latestScoreRef.current, normalizedScore);
    setScore((currentScore) => Math.max(currentScore, normalizedScore));
  };

  const handleGameOver = async (finalScore: number) => {
    const normalizedFinalScore = Math.max(
      latestScoreRef.current,
      Math.max(0, Math.floor(finalScore)),
    );

    console.log(
      "💾 Game Over - Saving score:",
      normalizedFinalScore,
      "for game:",
      game.name,
      "user:",
      username,
    );

    latestScoreRef.current = normalizedFinalScore;
    setScore(normalizedFinalScore);
    setGameState("gameover");

    const persistResult = await persistRunScore(normalizedFinalScore);
    
      // Reward 5 coins for playing a game if not already saved
      if (!scoreSavedInPlay) {
        let newCoins = await addReward(5);
        if (newCoins > 0) {
          setEarnedCoins((prev) => prev + newCoins);
        }
      }
  };

  const handleRetry = () => {
    setGameState("start");
    setScore(0);
    latestScoreRef.current = 0;
    lastPersistedScoreRef.current = 0;
    hasCountedGameRef.current = false;
    setScoreSavedInPlay(false);
    setHasDoubled(false);
    setEarnedCoins(0);
  };

  const handleSaveScoreInPlay = useCallback(async () => {
    if (
      gameStateRef.current === "playing" &&
      latestScoreRef.current > 0 &&
      !scoreSavedInPlay
    ) {
      await persistRunScore(latestScoreRef.current);
      setScoreSavedInPlay(true);
      let newCoins = await addReward(5);
      if (newCoins > 0) {
        setEarnedCoins((prev) => prev + newCoins);
      }
    }
  }, [scoreSavedInPlay, persistRunScore, addReward]);

  const handleBackClick = async () => {
    if (gameStateRef.current === "playing") {
      await persistRunScore(latestScoreRef.current);
      if (!scoreSavedInPlay && latestScoreRef.current > 0) {
        let newCoins = await addReward(5);
        if (newCoins > 0) {
          setEarnedCoins((prev) => prev + newCoins);
        }
      }
    }

    setLocation("/");
  };

  const handleRewardDouble = async () => {
    if (hasDoubled || score === 0) return;

    window.open("https://www.profitablecpmratenetwork.com/kegnjhbu47?key=94705897a820e4a9b1cc8aa8e47d4ce4", "_blank");

    setHasDoubled(true);
    const originalScore = score;
    const doubled = score * 2;
    setScore(doubled);
    latestScoreRef.current = Math.max(latestScoreRef.current, doubled);
    const persistResult = await persistRunScore(doubled);
    
    // Award additional coins for watching the ad
    let extraCoins = await addReward(5);

    if (extraCoins > 0) {
      setEarnedCoins(prev => prev + extraCoins);
    }
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/share/${gameId}/${score}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const persistScoreOnDisconnect = useCallback(() => {
    if (gameStateRef.current === "playing" && latestScoreRef.current > 0) {
      console.log(
        "🔌 Player disconnect detected, saving score:",
        latestScoreRef.current,
      );
      persistRunScoreSync(latestScoreRef.current);
    }
  }, [persistRunScoreSync]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      persistScoreOnDisconnect();
    };

    const handlePopState = () => {
      persistScoreOnDisconnect();
    };

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "hidden" &&
        gameStateRef.current === "playing"
      ) {
        persistScoreOnDisconnect();
      }
    };

    const handleOnline = () => {
      if (
        gameStateRef.current === "playing" &&
        latestScoreRef.current > lastPersistedScoreRef.current
      ) {
        persistScoreOnDisconnect();
      }
    };

    const handleOffline = () => {
      console.log("⚠️ Network offline - score cached for later sync");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);

      persistScoreOnDisconnect();
    };
  }, [persistScoreOnDisconnect]);

  const renderGameComponent = () => {
    switch (game.id) {
      case "memory":
        return (
          <MemoryCollapse
            onGameOver={handleGameOver}
            onScoreChange={handleScoreChange}
          />
        );
      case "blink":
        return (
          <DontBlink
            onGameOver={handleGameOver}
            onScoreChange={handleScoreChange}
          />
        );
      case "taptrap":
        return (
          <FakeTapTrap
            onGameOver={handleGameOver}
            onScoreChange={handleScoreChange}
          />
        );
      case "illusion":
        return (
          <IllusionFinder
            onGameOver={handleGameOver}
            onScoreChange={handleScoreChange}
          />
        );
      case "simon":
        return (
          <SimonSays
            onGameOver={handleGameOver}
            onScoreChange={handleScoreChange}
          />
        );
      case "colorblast":
        return (
          <ColorBlast
            onGameOver={handleGameOver}
            onScoreChange={handleScoreChange}
          />
        );
      case "matchpairs":
        return (
          <MatchPairs
            onGameOver={handleGameOver}
            onScoreChange={handleScoreChange}
          />
        );
      case "neonbounce":
        return (
          <NeonBounce
            onGameOver={handleGameOver}
            onScoreChange={handleScoreChange}
          />
        );
      case "fruitslice":
        return (
          <FruitSlice
            onGameOver={handleGameOver}
            onScoreChange={handleScoreChange}
          />
        );
      default:
        return <div>Unknown Game</div>;
    }
  };

  return (
    <Layout>
      <div
        className={`flex-1 flex flex-col ${gameState === "playing" ? "bg-white" : "bg-gray-50"}`}
      >
        <div className="flex items-center p-4">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={handleBackClick}
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h1 className="flex-1 text-center font-bold text-lg">{game.name}</h1>
          {gameState === "playing" && !scoreSavedInPlay && (
            <Button
              type="button"
              onClick={handleSaveScoreInPlay}
              className="rounded-full bg-lime-500 px-3 py-1 text-xs font-bold uppercase tracking-wider text-black hover:bg-lime-400"
            >
              Save Score
            </Button>
          )}
          {scoreSavedInPlay && (
            <span className="text-xs font-bold uppercase tracking-wider text-lime-500">
              ✓ Saved
            </span>
          )}
        </div>

        <div className={`flex-1 flex flex-col items-center justify-center relative ${gameState === "playing" && (game.id === "fruitslice" || game.id === "neonbounce") ? "p-0" : "p-6"}`}>
          {gameState === "start" && (
            <div className="w-full max-w-sm flex flex-col items-center text-center">
              <div
                className={`w-32 h-32 rounded-[32px] ${game.gradient} flex items-center justify-center shadow-xl shadow-gray-200 mb-8`}
              >
                <game.icon className="w-16 h-16 text-white" />
              </div>
              <h2 className="text-3xl font-black mb-4">{game.name}</h2>
              <p className="text-gray-500 mb-10">{game.description}</p>

              <Button
                onClick={handleStart}
                className="w-full h-14 rounded-2xl text-lg font-bold flex items-center gap-2"
              >
                <Play className="w-5 h-5 fill-white" />
                PLAY NOW
              </Button>
              {bestScore > 0 && (
                <div className="mt-6 text-sm font-bold text-gray-400 uppercase tracking-widest">
                  Best Score: {bestScore}
                </div>
              )}
            </div>
          )}

          {gameState === "playing" && (
            <div className="w-full flex-1 flex flex-col">
              <div className="w-full flex-1 flex flex-col">{renderGameComponent()}</div>
              <div className="w-full py-4 mt-auto text-center text-sm font-bold text-gray-400 uppercase tracking-widest">
                Best Score: {bestScore}
              </div>
            </div>
          )}

          {gameState === "gameover" && (
            <div className="w-full max-w-sm flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
              <div className="bg-white p-8 rounded-[32px] shadow-xl shadow-gray-100 w-full mb-6 border border-gray-100">
                <p className="text-gray-400 font-bold uppercase tracking-widest text-sm mb-2">
                  Final Score
                </p>
                <h2 className="text-6xl font-black text-primary">{score}</h2>
                {earnedCoins > 0 && (
                  <div className="mt-2 text-yellow-600 font-bold text-lg animate-in slide-in-from-bottom-2">
                    +🪙 {earnedCoins} Coins
                  </div>
                )}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-1">
                    Best Score
                  </p>
                  <p className="text-xl font-bold text-gray-700">{bestScore}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 w-full">
                {!hasDoubled && score > 0 && (
                  <Button
                    onClick={handleRewardDouble}
                    variant="outline"
                    className="h-14 rounded-2xl text-lg font-bold border-2 border-purple-200 text-purple-600 bg-purple-50 hover:bg-purple-100"
                  >
                    <Play className="w-5 h-5 mr-2 fill-current" />
                    Watch Ad to 2x Score
                  </Button>
                )}

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <Button
                    onClick={handleRetry}
                    variant="outline"
                    className="h-14 rounded-2xl text-lg font-bold"
                  >
                    <RotateCcw className="w-5 h-5 mr-2" />
                    Retry
                  </Button>
                  <Button
                    onClick={handleShare}
                    variant="outline"
                    className="h-14 rounded-2xl text-lg font-bold"
                  >
                    <Share2 className="w-5 h-5 mr-2" />
                    {copied ? "Copied!" : "Share"}
                  </Button>
                </div>
                <Link href="/leaderboard" className="contents">
                  <Button className="h-14 rounded-2xl text-lg font-bold">
                    <Trophy className="w-5 h-5 mr-2" />
                    Rank
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <InterstitialAd
        open={showInterstitial}
        onOpenChange={setShowInterstitial}
      />
    </Layout>
  );
}