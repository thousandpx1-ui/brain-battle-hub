import { useState, useEffect, useCallback, Dispatch, SetStateAction } from "react";
import { createCoinUser, getCoinBalance, rewardCoins } from "@/lib/coins";
import { useAppState } from "./useAppState";

// Keep multiple instances of the hook in sync
let globalCoins = 0;
let isFetchingBalance = false;
const coinListeners = new Set<Dispatch<SetStateAction<number>>>();

export function useCoins() {
  const { userId, username } = useAppState();
  const activeId = username || userId || "player"; // Tie coins back to username to sync with the backend leaderboard row
  
  const [coins, setCoins] = useState<number>(globalCoins);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    coinListeners.add(setCoins);
    return () => {
      coinListeners.delete(setCoins);
    };
  }, []);

  // Auto-migrate identity and coins when username changes
  useEffect(() => {
    const lastKnownId = localStorage.getItem("bb_last_known_id");
    if (lastKnownId && lastKnownId !== activeId) {
      // Migrate local coins
      const oldLocalKey = `bb_coins_${lastKnownId}`;
      const newLocalKey = `bb_coins_${activeId}`;
      const oldCoins = parseInt(localStorage.getItem(oldLocalKey) || "0", 10);
      
      if (oldCoins > 0) {
         const newCoins = parseInt(localStorage.getItem(newLocalKey) || "0", 10);
         localStorage.setItem(newLocalKey, Math.max(oldCoins, newCoins).toString());
      }

      // Migrate backend leaderboard row (using dedicated endpoint if available)
      const API_URL = import.meta.env.VITE_API_BASE_URL || "https://leaderboard.thousandpx1.workers.dev";
      fetch(`${API_URL}/migrate-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldId: lastKnownId, newId: activeId })
      }).catch(console.error);

      // FALLBACK: Manually copy the old score to the new user via /save-score just in case /migrate-user is not deployed yet
      fetch(`${API_URL}/api/leaderboard`)
        .then(res => (res.ok ? res.json() : fetch(`${API_URL}/leaderboard`).then(r => r.json())))
        .then(data => {
          const entries = Array.isArray(data) ? data : (data?.value || []);
          const oldEntry = entries.find((e: any) => (e.userId === lastKnownId || e.username === lastKnownId));
          if (oldEntry && oldEntry.score > 0) {
            fetch(`${API_URL}/save-score`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: activeId,
                username: oldEntry.username || activeId,
                score: Number(oldEntry.score),
                profileFrame: oldEntry.profileFrame || oldEntry.frame || null,
                profileImage: oldEntry.profileImage || oldEntry.avatar || null,
              })
            }).catch(console.error);
          }
        }).catch(console.error);
    }
    
    localStorage.setItem("bb_last_known_id", activeId);
  }, [activeId]);

  const updateGlobalCoins = useCallback((newAmount: number) => {
    globalCoins = newAmount;
    coinListeners.forEach((listener) => listener(newAmount));
  }, []);

  const fetchBalance = useCallback(async () => {
    if (!activeId || isFetchingBalance) return;
    try {
      isFetchingBalance = true;
      setLoading(true);
      const balance = await getCoinBalance(activeId);
      updateGlobalCoins(balance);
    } catch (err) {
      console.error("Failed to fetch coins:", err);
    } finally {
      isFetchingBalance = false;
      setLoading(false);
    }
  }, [activeId, updateGlobalCoins]);

  useEffect(() => {
    if (activeId) {
      // Ensure user is created
      createCoinUser(activeId, username || "Player").catch(console.error);
      fetchBalance();
    }
  }, [activeId, username, fetchBalance]);

  const addReward = useCallback(async (amount: number) => {
    if (!activeId) return 0;
    
    if (amount <= 0) return 0;

    try {
      await rewardCoins(activeId, amount);
      await fetchBalance();
      return amount;
    } catch (err) {
      console.error("Failed to add reward:", err);
      return 0;
    }
  }, [activeId, fetchBalance]);

  return { coins, loading, addReward, refreshCoins: fetchBalance };
}
