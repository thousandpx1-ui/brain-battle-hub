import { create } from "zustand";
import { persist } from "zustand/middleware";
import { differenceInDays, startOfDay } from "date-fns";
import { useLocalLeaderboard } from "@/lib/local-leaderboard";

interface AppState {
  username: string | null;
  oldUsernames: string[];
  setUsername: (name: string) => void;
  updateUsername: (newName: string) => void;

  profileImage: string | null;
  setProfileImage: (image: string | null) => void;

  profileFrame: string | null;
  setProfileFrame: (frame: string | null) => void;

  streak: number;
  lastPlayedDate: string | null;
  updateStreak: () => void;

  gamesPlayedSession: number;
  incrementGamesPlayed: () => void;
  resetGamesPlayedSession: () => void;
}

export const useAppState = create<AppState>()(
  persist(
    (set, get) => ({
      username: null,
      oldUsernames: [],
      setUsername: (name) => set({ username: name }),
      updateUsername: (newName) => {
        const oldName = get().username;
        if (oldName && oldName !== newName) {
          // Add old username to the list of old usernames
          const currentOldUsernames = get().oldUsernames;
          if (!currentOldUsernames.includes(oldName)) {
            set({ oldUsernames: [...currentOldUsernames, oldName] });
          }
        }
        set({ username: newName });
      },

      profileImage: null,
      setProfileImage: (image) => set({ profileImage: image }),

      profileFrame: null,
      setProfileFrame: (frame) => set({ profileFrame: frame }),

      streak: 0,
      lastPlayedDate: null,
      updateStreak: () => {
        const now = new Date();
        const last = get().lastPlayedDate ? new Date(get().lastPlayedDate!) : null;
        
        if (!last) {
          set({ streak: 1, lastPlayedDate: now.toISOString() });
          return;
        }

        const diff = differenceInDays(startOfDay(now), startOfDay(last));
        if (diff === 1) {
          set({ streak: get().streak + 1, lastPlayedDate: now.toISOString() });
        } else if (diff > 1) {
          set({ streak: 1, lastPlayedDate: now.toISOString() });
        } else {
          // diff === 0, same day, do nothing but maybe update time
          set({ lastPlayedDate: now.toISOString() });
        }
      },

      gamesPlayedSession: 0,
      incrementGamesPlayed: () => set((state) => ({ gamesPlayedSession: state.gamesPlayedSession + 1 })),
      resetGamesPlayedSession: () => set({ gamesPlayedSession: 0 }),
    }),
    {
      name: "brain-battle-hub-storage",
    }
  )
);
