// Cache to map userIds to usernames (frontend-only workaround until backend is deployed)

const CACHE_KEY = "userIdToUsername";

interface UserCache {
  [userId: string]: {
    username: string;
    lastUpdated: number;
  };
}

function getCache(): UserCache {
  try {
    const data = localStorage.getItem(CACHE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function setCache(cache: UserCache): void {
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

// Cache the current user's username
export function cacheMyUsername(userId: string, username: string): void {
  if (!userId || !username) return;
  
  const cache = getCache();
  cache[userId] = {
    username,
    lastUpdated: Date.now()
  };
  setCache(cache);
  console.log(`[UserNameCache] Cached: ${userId} → ${username}`);
}

// Get username for a userId, with fallback
export function getUsername(userId: string, fallback?: string): string | undefined {
  const cache = getCache();
  const entry = cache[userId];
  
  if (entry) {
    return entry.username;
  }
  
  // Return fallback if provided (like userId)
  return fallback;
}

// Get the full cache (for debugging)
export function getCacheDebug(): UserCache {
  return getCache();
}
