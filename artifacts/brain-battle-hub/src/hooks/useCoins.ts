import { useState, useEffect, useCallback } from "react";
import { createCoinUser, getCoinBalance, rewardCoins, calculateCoins } from "@/lib/coins";
import { useAppState } from "./useAppState";

export function useCoins() {
  const { userId, username } = useAppState();
  
  const [coins, setCoins] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const balance = await getCoinBalance(userId);
      setCoins(balance);
    } catch (err) {
      console.error("Failed to fetch coins:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      // Ensure user is created
      createCoinUser(userId, username || "Player").catch(console.error);
      fetchBalance();
    }
  }, [userId, username, fetchBalance]);

  const addReward = useCallback(async (currentScore: number, previousScore: number = 0) => {
    if (!userId) return 0;
    const currentCoins = calculateCoins(currentScore);
    const previousCoins = calculateCoins(previousScore);
    const amount = currentCoins - previousCoins;
    
    if (amount <= 0) return 0;

    try {
      await rewardCoins(userId, amount);
      await fetchBalance();
      return amount;
    } catch (err) {
      console.error("Failed to add reward:", err);
      return 0;
    }
  }, [userId, fetchBalance]);

  return { coins, loading, addReward, refreshCoins: fetchBalance };
}
