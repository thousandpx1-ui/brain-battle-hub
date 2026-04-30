const API_URL = "https://users.thousandpx1.workers.dev";

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

export async function saveScoreRealtime(
  score: number,
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

  let currentScore = 0;
  try {
    const leaderboard = await loadLeaderboardRealtime();
    const existingEntry = leaderboard.find(
      (e) => e.userId === normalizedUsername,
    );
    currentScore = existingEntry?.score || 0;
  } catch (e) {
    console.warn(
      "Could not fetch current score, proceeding with new score only",
    );
  }

  const newTotalScore = currentScore + score;
  console.log(
    `Score update for ${normalizedUsername}: ${currentScore} + ${score} = ${newTotalScore}`,
  );

  const response = await fetch(`${API_URL}/save-score`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: normalizedUsername,
      score: newTotalScore,
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
  return { ...responseData, newTotalScore, previousTotalScore: currentScore };
}

export async function loadLeaderboardRealtime() {
  const res = await fetch(`${API_URL}/api/leaderboard`, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`Failed to load realtime leaderboard: ${res.status}`);
  }

  const data = await res.json();

  return (Array.isArray(data) ? data : [])
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
