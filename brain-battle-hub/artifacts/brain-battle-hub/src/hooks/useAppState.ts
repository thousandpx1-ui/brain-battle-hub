import { create } from "zustand";
import { persist } from "zustand/middleware";
import { differenceInDays, startOfDay } from "date-fns";

interface AppState {
  username: string | null;
  setUsername: (name: string) => void;

  profileImage: string | null;
  setProfileImage: (image: string | null) => void;

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
      setUsername: (name) => set({ username: name }),

      profileImage: null,
      setProfileImage: (image) => set({ profileImage: image }),

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
