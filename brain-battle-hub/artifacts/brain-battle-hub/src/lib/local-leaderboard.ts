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
  clearScores: () => void;
}

export const useLocalLeaderboard = create<LocalLeaderboardState>()(
  persist(
    (set, get) => ({
      scores: [],
      addScore: (entry) => {
        const newEntry: LocalScoreEntry = {
          ...entry,
          createdAt: new Date().toISOString(),
        };
        set({ scores: [...get().scores, newEntry] });
      },
      clearScores: () => set({ scores: [] }),
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
