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
  return await coinsApi("/reward", "POST", { userId, amount });
}

export async function getCoinBalance(userId: string) {
  const data = await coinsApi(`/balance?userId=${userId}`);
  return data?.coins || 0;
}

export function calculateCoins(score: number): number {
  return Math.floor(score / 100) * 5; // Reward 5 coins for every 100 points
}
