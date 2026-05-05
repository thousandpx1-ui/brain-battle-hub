import { create } from "zustand";
import { persist, PersistStorage } from "zustand/middleware";

export interface LocalScoreEntry {
  username: string;
  gameId: string;
  score: number;
  createdAt: string;
}

interface LocalLeaderboardState {
  scores: LocalScoreEntry[];
  version: number;
  addScore: (entry: Omit<LocalScoreEntry, "createdAt">) => void;
  updateUsername: (oldUsername: string, newUsername: string) => void;
  clearScores: () => void;
}

// Create a custom storage that ensures synchronous writes
const createSyncStorage = (): PersistStorage<LocalLeaderboardState> => {
  return {
    getItem: (name) => {
      const str = localStorage.getItem(name);
      if (!str) return null;
      return JSON.parse(str);
    },
    setItem: (name, value) => {
      localStorage.setItem(name, JSON.stringify(value));
    },
    removeItem: (name) => {
      localStorage.removeItem(name);
    },
  };
};

export const useLocalLeaderboard = create<LocalLeaderboardState>()(
  persist(
    (set) => ({
      scores: [],
      version: 0,
      addScore: (entry) => {
        const newEntry: LocalScoreEntry = {
          ...entry,
          createdAt: new Date().toISOString(),
        };
        // Use functional update to ensure we always work with latest state
        set((state) => {
          const newScores = [...state.scores, newEntry];
          console.log('[LocalLeaderboard] Adding score:', entry.username, entry.score, '| Total scores:', newScores.length);
          return {
            scores: newScores,
            version: state.version + 1
          };
        });
      },
      updateUsername: (oldUsername, newUsername) => {
        set((state) => ({
          scores: state.scores.map(score =>
            score.username === oldUsername ? { ...score, username: newUsername } : score
          ),
          version: state.version + 1
        }));
      },
      clearScores: () => set({ scores: [], version: 0 }),
    }),
    {
      name: "brain-battle-leaderboard",
      storage: createSyncStorage(),
      migrate: (persisted: any) => {
        // Add version field to existing state if missing
        if (persisted && persisted.state) {
          if (typeof persisted.state.version !== "number") {
            persisted.state.version = 0;
          }
        }
        return persisted?.state || {};
      },
    }
  )
);

export function mergeLocalWithMock(mockEntries: LocalScoreEntry[], localScores: LocalScoreEntry[]): LocalScoreEntry[] {
  // Group local scores by username and sum scores (cumulative)
  const totalScores = new Map<string, LocalScoreEntry>();
  for (const score of localScores) {
    const existing = totalScores.get(score.username);
    if (existing) {
      existing.score += score.score;
    } else {
      totalScores.set(score.username, { ...score });
    }
  }

  const localTotalScores = Array.from(totalScores.values());
  const combined = [...mockEntries, ...localTotalScores];
  return combined.sort((a, b) => b.score - a.score);
}
