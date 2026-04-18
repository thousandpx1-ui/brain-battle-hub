const API_URL = "https://mute-art-58b0.thousandpx1.workers.dev";

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
  if (normalized.toLowerCase().includes("test")) return false;

  return true;
}

export async function saveScoreRealtime(score: number, username: string, profileFrame?: string | null) {
  const normalizedUsername = normalizeUsername(username);

  if (!isValidRealtimeUsername(normalizedUsername)) {
    console.warn("Skipping realtime leaderboard save for invalid username:", username);
    return null;
  }

  const response = await fetch(`${API_URL}/save-score`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      userId: normalizedUsername,
      score,
      profileFrame: profileFrame || null
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to save realtime score: ${response.status}`);
  }

  return response.json();
}

export async function loadLeaderboardRealtime() {
  const res = await fetch(`${API_URL}/leaderboard`, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`Failed to load realtime leaderboard: ${res.status}`);
  }

  const data = await res.json();

  return (Array.isArray(data) ? data : [])
    .map((entry) => ({
      userId: normalizeUsername(entry.userId || entry.username),
      score: Number(entry.score) || 0,
      profileFrame: entry.profileFrame || null,
    }))
    .filter((entry) => isValidRealtimeUsername(entry.userId))
    .sort((a, b) => b.score - a.score);
}
