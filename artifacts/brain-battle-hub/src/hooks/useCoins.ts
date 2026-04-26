import { useState, useEffect, useCallback, Dispatch, SetStateAction } from "react";
import { createCoinUser, getCoinBalance, rewardCoins, calculateCoins } from "@/lib/coins";
import { useAppState } from "./useAppState";

// Keep multiple instances of the hook in sync
let globalCoins = 0;
const coinListeners = new Set<Dispatch<SetStateAction<number>>>();

export function useCoins() {
  const { userId, username } = useAppState();
  const activeId = username || userId || "player";
  
  const [coins, setCoins] = useState<number>(globalCoins);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    coinListeners.add(setCoins);
    return () => {
      coinListeners.delete(setCoins);
    };
  }, []);

  const updateGlobalCoins = useCallback((newAmount: number) => {
    globalCoins = newAmount;
    coinListeners.forEach((listener) => listener(newAmount));
  }, []);

  const fetchBalance = useCallback(async () => {
    if (!activeId) return;
    try {
      setLoading(true);
      const balance = await getCoinBalance(activeId);
      updateGlobalCoins(balance);
    } catch (err) {
      console.error("Failed to fetch coins:", err);
    } finally {
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

  const addReward = useCallback(async (currentScore: number, previousScore: number = 0) => {
    if (!activeId) return 0;
    const currentCoins = calculateCoins(currentScore);
    const previousCoins = calculateCoins(previousScore);
    const amount = currentCoins - previousCoins;
    
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
