import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MockLeaderboardEntry } from "@/lib/mock-leaderboard";

interface LocalScoreEntry {
  username: string;
  gameId: string;
  score: number;
  createdAt: string;
}

interface LocalLeaderboardState {
  scores: LocalScoreEntry[];
  addScore: (entry: Omit<LocalScoreEntry, "createdAt">) => void;
  getScores: (gameId?: string) => LocalScoreEntry[];
}

export const useLocalLeaderboard = create<LocalLeaderboardState>()(
  persist(
    (set, get) => ({
      scores: [],
      addScore: (entry) =>
        set((state) => ({
          scores: [
            ...state.scores,
            { ...entry, createdAt: new Date().toISOString() },
          ],
        })),
      getScores: (gameId) => {
        const scores = get().scores;
        const filtered = gameId ? scores.filter((s) => s.gameId === gameId) : scores;
        return filtered.sort((a, b) => b.score - a.score);
      },
    }),
    {
      name: "brain-battle-leaderboard",
    }
  )
);

export function mergeLocalWithMock(mockEntries: MockLeaderboardEntry[]): MockLeaderboardEntry[] {
  const localScores = useLocalLeaderboard.getState().scores;
  const combined = [...mockEntries, ...localScores];
  return combined.sort((a, b) => b.score - a.score);
}
