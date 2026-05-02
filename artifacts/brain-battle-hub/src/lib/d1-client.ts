// Cloudflare D1 Client for Leaderboard functionality

interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  gameId: string;
  createdAt: string;
  profileFrame?: string;
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://leaderboard.thousandpx1.workers.dev";

// Known game names to filter out from leaderboard
const GAME_NAMES = [
  "Memory Collapse",
  "DontBlink",
  "FakeTapTrap",
  "IllusionFinder",
  "Illusion Finder",
];

function isValidUsername(username: string): boolean {
  // Filter out known game names
  if (GAME_NAMES.includes(username)) return false;

  // Filter out usernames that look like game IDs
  if (username.startsWith("guest_")) return false;

  // Filter out empty or very short usernames
  if (!username || username.length < 2) return false;

  return true;
}

// Save score to D1 database
async function saveScore(
  score: number,
  username?: string | null,
  profileFrame?: string | null,
): Promise<any> {
  try {
    let finalUsername = username || "player";

    // Validate username - don't save if it looks like a game name
    if (!isValidUsername(finalUsername)) {
      return null;
    }

    // Note: Scores should be cumulative - the caller should handle adding to existing score
    const response = await fetch(`${API_BASE_URL}/save-score`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: finalUsername,
        score,
        profileFrame: profileFrame || null,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    throw error;
  }
}

// Get all-time leaderboard
async function getAllTimeLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/leaderboard`, {
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const responseData = await response.json();
    // Handle API response format: { value: [...] } or direct array
    const data = Array.isArray(responseData) ? responseData : (responseData?.value || []);
    console.log("All-time leaderboard:", data.length, "entries");

    // Filter out invalid usernames (game names, test entries, etc.)
    const filteredData = data.filter((entry: any) =>
      isValidUsername(entry.username || entry.userId),
    );

    // Transform the response to match expected format
    return filteredData.map((entry: any, index: number) => ({
      rank: index + 1,
      username: entry.username || entry.userId,
      score: entry.score,
      gameId: "unknown",
      createdAt: entry.createdAt,
    }));
  } catch (error) {
    console.error("Error fetching all-time leaderboard:", error);
    return [];
  }
}

// Get today's leaderboard
async function getTodayLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/leaderboard`, {
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const responseData = await response.json();
    // Handle API response format: { value: [...] } or direct array
    const allData = Array.isArray(responseData) ? responseData : (responseData?.value || []);

    // Filter for today's entries and valid usernames
    const today = new Date().toDateString();
    const todayData = allData.filter(
      (entry: any) =>
        new Date(entry.createdAt).toDateString() === today &&
        isValidUsername(entry.username || entry.userId),
    );

    console.log("Today leaderboard:", todayData.length, "entries");

    // Transform the response to match expected format
    return todayData.map((entry: any, index: number) => ({
      rank: index + 1,
      username: entry.username || entry.userId,
      score: entry.score,
      gameId: "unknown",
      createdAt: entry.createdAt,
    }));
  } catch (error) {
    console.error("Error fetching today leaderboard:", error);
    return [];
  }
}

// Unified leaderboard function (backward compatible)
async function getFullLeaderboard(
  period?: string,
): Promise<LeaderboardEntry[]> {
  if (period === "daily") {
    return getTodayLeaderboard();
  }
  return getAllTimeLeaderboard();
}

// Backward compatible alias
async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  return getAllTimeLeaderboard();
}

// Medal helper
function getMedal(index: number): string {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";
  return "";
}

export {
  saveScore,
  getLeaderboard,
  getFullLeaderboard,
  getAllTimeLeaderboard,
  getTodayLeaderboard,
  getMedal,
};
