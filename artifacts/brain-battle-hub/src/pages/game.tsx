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

import { saveScoreRealtime } from "@/lib/realtime-leaderboard";
import { useAppState } from "@/hooks/useAppState";
import { useLocalLeaderboard } from "@/lib/local-leaderboard";
import { InterstitialAd } from "@/components/interstitial-ad";
import { Trophy, RotateCcw, Play, ChevronLeft } from "lucide-react";

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
    gamesPlayedSession,
    incrementGamesPlayed,
    userId,
  } = useAppState();
  const addLocalScore = useLocalLeaderboard((s) => s.addScore);

  const [showInterstitial, setShowInterstitial] = useState(false);
  const [hasDoubled, setHasDoubled] = useState(false);
  const [scoreSavedInPlay, setScoreSavedInPlay] = useState(false);

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
        const saveName = username || userId || "player";
        console.log("💾 Saving to real-time leaderboard:", {
          userId: saveName,
          score: scoreToPersist,
          profileFrame,
        });
        await saveScoreRealtime(scoreToPersist, saveName, profileFrame);
        console.log("✅ Score saved to real-time leaderboard");
      } catch (error) {
        console.error("❌ Failed to save to real-time leaderboard:", error);
      }

      lastPersistedScoreRef.current = scoreToPersist;
      return true;
    },
    [addLocalScore, game, profileFrame, userId, username],
  );

  const persistRunScoreSync = useCallback(
    (scoreToPersist: number) => {
      if (!game || scoreToPersist <= lastPersistedScoreRef.current) return;

      if (username) {
        addLocalScore({ gameId: game.id, username, score: scoreToPersist });
      }

      try {
        const saveName = username || userId || "player";
        saveScoreRealtime(scoreToPersist, saveName, profileFrame).catch((err) =>
          console.error("Failed to save realtime score on back:", err),
        );
      } catch (error) {
        console.error("Failed to save realtime score on back:", error);
      }

      lastPersistedScoreRef.current = scoreToPersist;
    },
    [addLocalScore, game, profileFrame, userId, username],
  );

  const handleStart = () => {
    latestScoreRef.current = 0;
    lastPersistedScoreRef.current = 0;
    hasCountedGameRef.current = false;
    setScore(0);
    setGameState("playing");
    setScoreSavedInPlay(false);
    setHasDoubled(false);
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

    await persistRunScore(normalizedFinalScore);

    if (!hasCountedGameRef.current) {
      incrementGamesPlayed();
      hasCountedGameRef.current = true;

      if (gamesPlayedSession > 0 && gamesPlayedSession % 3 === 0) {
        setShowInterstitial(true);
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
  };

  const handleSaveScoreInPlay = useCallback(async () => {
    if (
      gameStateRef.current === "playing" &&
      latestScoreRef.current > 0 &&
      !scoreSavedInPlay
    ) {
      await persistRunScore(latestScoreRef.current);
      setScoreSavedInPlay(true);
    }
  }, [scoreSavedInPlay, persistRunScore]);

  const handleBackClick = async () => {
    if (gameStateRef.current === "playing") {
      await persistRunScore(latestScoreRef.current);
    }

    setLocation("/");
  };

  const handleRewardDouble = async () => {
    if (hasDoubled || score === 0) return;
    
    window.open("https://omg10.com/4/10900602", "_blank");

    setHasDoubled(true);
    const doubled = score * 2;
    setScore(doubled);
    latestScoreRef.current = Math.max(latestScoreRef.current, doubled);
    await persistRunScore(doubled);
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

        <div className="flex-1 p-6 flex flex-col items-center justify-center relative">
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
            </div>
          )}

          {gameState === "playing" && (
            <div className="w-full flex-1">{renderGameComponent()}</div>
          )}

          {gameState === "gameover" && (
            <div className="w-full max-w-sm flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
              <div className="bg-white p-8 rounded-[32px] shadow-xl shadow-gray-100 w-full mb-6 border border-gray-100">
                <p className="text-gray-400 font-bold uppercase tracking-widest text-sm mb-2">
                  Final Score
                </p>
                <h2 className="text-6xl font-black text-primary">{score}</h2>
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

      <InterstitialAd
        open={showInterstitial}
        onOpenChange={setShowInterstitial}
      />
    </Layout>
  );
}
