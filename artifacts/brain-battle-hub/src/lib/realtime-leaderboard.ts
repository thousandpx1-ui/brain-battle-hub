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

export async function saveScoreRealtime(
  score: number,
  userId: string,
  username: string,
  profileFrame?: string | null,
  profileImage?: string | null,
) {
  const normalizedUsername = normalizeUsername(username);

  if (!isValidRealtimeUsername(normalizedUsername)) {
    console.warn(
      "Skipping realtime leaderboard save for invalid username:",
      username,
    );
    return null;
  }

  console.log(
    `Score update for ${normalizedUsername}: sending +${score} points`,
  );

  const response = await fetch(`${API_URL}/save-score`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: userId || normalizedUsername,
      username: normalizedUsername,
      score: score,
      profileFrame: profileFrame || null,
      profileImage: profileImage || null,
      frame: profileFrame || null,
      avatar: profileImage || null,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to save realtime score: ${response.status}`);
  }

  const responseData = await response.json();
  return { ...responseData, scoreAdded: score };
}

export async function loadLeaderboardRealtime() {
  // Try primary endpoint first
  let res = await fetch(`${API_URL}/api/leaderboard`, { cache: "no-store" });
  
  // If 404, try alternative endpoint
  if (!res.ok && res.status === 404) {
    res = await fetch(`${API_URL}/leaderboard`, { cache: "no-store" });
  }

  if (!res.ok) {
    console.warn(`Leaderboard API failed with status ${res.status}, returning empty array`);
    return [];
  }

  const data = await res.json();
  // Handle API response format: { value: [...] } or direct array
  const entries = Array.isArray(data) ? data : (data?.value || []);

  return entries
    .map((entry) => {
      const pFrame = entry.profileFrame || entry.frame || null;
      const pImage = entry.profileImage || entry.avatar || null;
      return {
        userId: normalizeUsername(entry.userId || entry.username),
        score: Number(entry.score) || 0,
        profileFrame: pFrame === 'none' ? null : pFrame,
        profileImage: pImage === 'none' ? null : pImage,
      };
    })
    .filter((entry) => isValidRealtimeUsername(entry.userId))
    .sort((a, b) => b.score - a.score);
}
