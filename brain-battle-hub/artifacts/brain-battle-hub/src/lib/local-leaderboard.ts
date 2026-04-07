import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface LocalScoreEntry {
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
        set((state) => {
          const newEntry = { ...entry, createdAt: new Date().toISOString() };
          // Replace array reference to force reactivity
          const newScores = [...state.scores, newEntry];
          return { scores: newScores };
        }),
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

export function mergeLocalWithMock(mockEntries: LocalScoreEntry[], localScores: LocalScoreEntry[]): LocalScoreEntry[] {
  // Group local scores by username and keep only best score
  const bestScores = new Map<string, LocalScoreEntry>();
  for (const score of localScores) {
    const existing = bestScores.get(score.username);
    if (!existing || score.score > existing.score) {
      bestScores.set(score.username, score);
    }
  }

  const uniqueLocalScores = Array.from(bestScores.values());
  const combined = [...mockEntries, ...uniqueLocalScores];
  return combined.sort((a, b) => b.score - a.score);
}
