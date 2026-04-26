const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://backend-api.thousandpx1.workers.dev";

export async function coinsApi(path: string, method = "GET", body: any = null) {
  try {
    const res = await fetch(API_BASE_URL + path, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : null,
    });

    if (!res.ok) {
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error(`Coins API Error (${path}):`, error);
    return null;
  }
}

export async function createCoinUser(userId: string, username: string) {
  return await coinsApi("/create-user", "POST", { id: userId, username });
}

export async function rewardCoins(userId: string, amount: number) {
  if (amount <= 0) return null;
  
  // Local fallback: instantly save to localStorage
  const localKey = `bb_coins_${userId}`;
  const current = parseInt(localStorage.getItem(localKey) || "0", 10);
  localStorage.setItem(localKey, (current + amount).toString());

  return await coinsApi("/reward", "POST", { userId, amount });
}

export async function getCoinBalance(userId: string) {
  const localKey = `bb_coins_${userId}`;
  const data = await coinsApi(`/balance?userId=${userId}`);
  
  const localCoins = parseInt(localStorage.getItem(localKey) || "0", 10);
  
  if (data && typeof data.coins === 'number') {
    // Sync local with server, keeping whichever balance is higher
    const maxCoins = Math.max(localCoins, data.coins);
    if (maxCoins > data.coins) {
      coinsApi("/reward", "POST", { userId, amount: maxCoins - data.coins }).catch(() => {});
    }
    localStorage.setItem(localKey, maxCoins.toString());
    return maxCoins;
  }
  
  return localCoins;
}

export function calculateCoins(score: number): number {
  return Math.floor(score / 100) * 5; // Reward 5 coins for every 100 points
}
