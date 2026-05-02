const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://leaderboard.thousandpx1.workers.dev";

// Debug: log the API base URL being used
console.log('[Coins] API Base URL:', API_BASE_URL);

async function coinsApi(path: string, method = "GET", body: any = null) {
  try {
    const res = await fetch(API_BASE_URL + path, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : null,
    });

    if (!res.ok) {
      console.warn(`[Coins API] ${method} ${path} failed with status ${res.status}`);
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error(`[Coins API] Network error on ${path}:`, error);
    return null;
  }
}

async function createCoinUser(userId: string, username: string) {
  return await coinsApi("/create-user", "POST", { id: userId, username });
}

async function rewardCoins(userId: string, amount: number) {
  if (amount <= 0) return { coins: 0 };
  
  // Local fallback: instantly save to localStorage
  const localKey = `bb_coins_${userId}`;
  const current = parseInt(localStorage.getItem(localKey) || "0", 10);
  const newTotal = current + amount;
  localStorage.setItem(localKey, newTotal.toString());
  console.log(`[Coins] Updated local balance for ${userId}: ${newTotal}`);

  return await coinsApi("/reward", "POST", { userId, amount }) || { coins: newTotal };
}

async function getCoinBalance(userId: string) {
  const localKey = `bb_coins_${userId}`;
  const data = await coinsApi(`/balance?userId=${encodeURIComponent(userId)}`);
  
  const localCoins = parseInt(localStorage.getItem(localKey) || "0", 10);
  
  if (data && typeof data.coins === 'number') {
    // Sync local with server, keeping whichever balance is higher
    const maxCoins = Math.max(localCoins, data.coins);
    if (maxCoins > data.coins && maxCoins - data.coins > 0) {
      coinsApi("/reward", "POST", { userId, amount: maxCoins - data.coins }).catch(() => {});
    }
    localStorage.setItem(localKey, maxCoins.toString());
    return maxCoins;
  }
  
  // Return local coins if API fails
  console.log(`[Coins] Using local balance for ${userId}: ${localCoins}`);
  return localCoins;
}

export { createCoinUser, getCoinBalance, rewardCoins };
