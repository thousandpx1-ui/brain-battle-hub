const API_URL = "https://leaderboard.thousandpx1.workers.dev";

const INVALID_USERNAMES = new Set([
  "Memory Collapse",
  "DontBlink",
  "FakeTapTrap",
  "IllusionFinder",
  "Illusion Finder",
  "Block Blast",
  "ColorBlast",
  "colorblast",
]);

export interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
  profileFrame: string | null;
  profileImage: string | null;
}

function normalizeUsername(username?: string | null): string {
  return (username || "").trim();
}

function isValidRealtimeUsername(username?: string | null): boolean {
  const normalized = normalizeUsername(username);
  if (!normalized || normalized.length < 2) return false;
  if (INVALID_USERNAMES.has(normalized)) return false;
  if (normalized.startsWith("guest_")) return false;
  return true;
}

function getProfileFrame(entry: any): string | null {
  const val = entry.profileFrame || entry.profile_frame || entry.profileframe || entry.frame || null;
  return val === 'none' ? null : val;
}

function getProfileImage(entry: any): string | null {
  const val = entry.profileImage || entry.profile_image || entry.profileimage || entry.avatar || null;
  return val === 'none' ? null : val;
}

async function fetchWithRetry(url: string, options: RequestInit, retries = 3): Promise<Response> {
  let lastError: Error | null = null;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
      if (res.status >= 500) {
        lastError = new Error(`Server error: ${res.status}`);
        await new Promise(r => setTimeout(r, 500 * (i + 1)));
        continue;
      }
      return res;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      await new Promise(r => setTimeout(r, 500 * (i + 1)));
    }
  }
  throw lastError || new Error("Fetch failed after retries");
}

export async function saveScoreRealtime(
  score: number,
  userId: string,
  username: string,
  profileFrame?: string | null,
  profileImage?: string | null,
): Promise<{ success: boolean; scoreAdded: number } | null> {
  const normalizedUsername = normalizeUsername(username);

  if (!isValidRealtimeUsername(normalizedUsername)) {
    console.warn("Skipping realtime leaderboard save for invalid username:", username);
    return null;
  }

  try {
    const response = await fetchWithRetry(`${API_URL}/save-score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: userId || normalizedUsername,
        username: normalizedUsername,
        score,
        profileFrame: profileFrame || null,
        profileImage: profileImage || null,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to save realtime score: ${response.status}`);
    }

    const responseData = await response.json();
    return { ...responseData, scoreAdded: score };
  } catch (error) {
    console.error("Failed to save realtime score:", error);
    throw error;
  }
}

export async function updateProfileRealtime(
  userId: string,
  username?: string | null,
  profileFrame?: string | null,
  profileImage?: string | null,
): Promise<boolean> {
  if (!userId) return false;

  try {
    const response = await fetchWithRetry(`${API_URL}/update-profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        username: username || null,
        profileFrame: profileFrame || null,
        profileImage: profileImage || null,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update profile: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error("Failed to update profile:", error);
    return false;
  }
}

let leaderboardCache: LeaderboardEntry[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION_MS = 1500;

export async function loadLeaderboardRealtime(): Promise<LeaderboardEntry[]> {
  const now = Date.now();
  if (leaderboardCache && now - cacheTimestamp < CACHE_DURATION_MS) {
    return leaderboardCache;
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/leaderboard`, { cache: "no-store" });
    if (!res.ok && res.status === 404) {
      res = await fetch(`${API_URL}/leaderboard`, { cache: "no-store" });
    }
  } catch (error) {
    console.warn("Leaderboard fetch failed:", error);
    return leaderboardCache || [];
  }

  if (!res.ok) {
    console.warn(`Leaderboard API failed with status ${res.status}`);
    return leaderboardCache || [];
  }

  const data = await res.json();
  const entries = Array.isArray(data) ? data : (data?.value || data?.results || []);

  const parsed = entries
    .map((entry: any) => ({
      userId: normalizeUsername(entry.userId || entry.username || entry.user_id || ""),
      username: normalizeUsername(entry.username || entry.userId || entry.user_id || ""),
      score: Number(entry.score) || 0,
      profileFrame: getProfileFrame(entry),
      profileImage: getProfileImage(entry),
    }))
    .filter((entry: LeaderboardEntry) => isValidRealtimeUsername(entry.userId))
    .sort((a: LeaderboardEntry, b: LeaderboardEntry) => b.score - a.score);

  leaderboardCache = parsed;
  cacheTimestamp = now;

  return parsed;
}

export function invalidateLeaderboardCache() {
  leaderboardCache = null;
  cacheTimestamp = 0;
}
