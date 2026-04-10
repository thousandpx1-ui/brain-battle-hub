// Cloudflare D1 Client for Leaderboard functionality

interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  gameId: string;
  createdAt: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://mute-art-58b0.thousandpx1.workers.dev';

// Known game names to filter out from leaderboard
const GAME_NAMES = [
  'RiskOrSafe',
  'Risk or Safe',
  'Memory Collapse',
  'DontBlink',
  'FakeTapTrap',
  'IllusionFinder',
  'Illusion Finder'
];

function isValidUsername(username: string): boolean {
  // Filter out known game names
  if (GAME_NAMES.includes(username)) return false;

  // Filter out usernames that look like game IDs or test entries
  if (username.startsWith('guest_')) return false;
  if (username.includes('test')) return false;

  // Filter out empty or very short usernames
  if (!username || username.length < 2) return false;

  return true;
}

function log(msg: string) {
  const div = document.createElement("div");
  div.innerText = msg;
  div.style.color = "red";
  document.body.appendChild(div);
}

// Save score to D1 database
async function saveScore(score: number, username?: string | null): Promise<any> {
  log("Saving score: " + score + " for " + (username || "guest"));

  try {
    let userId = username || "guest_" + Date.now();
    let finalUsername = username || "guest_" + Date.now();

    // Validate username - don't save if it looks like a game name
    if (!isValidUsername(finalUsername)) {
      log("Skipping save for invalid username: " + finalUsername);
      return null;
    }

    const response = await fetch(`${API_BASE_URL}/save-score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        score: score
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    log("Saved successfully: " + JSON.stringify(result));
    return result;
  } catch (error) {
    log("SAVE ERROR: " + error.message);
    throw error;
  }
}

// Get all-time leaderboard
async function getAllTimeLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/leaderboard`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('All-time leaderboard:', data.length, 'entries');

    // Filter out invalid usernames (game names, test entries, etc.)
    const filteredData = data.filter((entry: any) => isValidUsername(entry.userId));

    // Transform the response to match expected format
    return filteredData.map((entry: any, index: number) => ({
      rank: index + 1,
      username: entry.userId,
      score: entry.score,
      gameId: 'unknown',
      createdAt: entry.createdAt
    }));
  } catch (error) {
    console.error('Error fetching all-time leaderboard:', error);
    return [];
  }
}

// Get today's leaderboard
async function getTodayLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/leaderboard`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const allData = await response.json();

    // Filter for today's entries and valid usernames
    const today = new Date().toDateString();
    const todayData = allData.filter((entry: any) =>
      new Date(entry.createdAt).toDateString() === today && isValidUsername(entry.userId)
    );

    console.log('Today leaderboard:', todayData.length, 'entries');

    // Transform the response to match expected format
    return todayData.map((entry: any, index: number) => ({
      rank: index + 1,
      username: entry.userId,
      score: entry.score,
      gameId: 'unknown',
      createdAt: entry.createdAt
    }));
  } catch (error) {
    console.error('Error fetching today leaderboard:', error);
    return [];
  }
}

// Unified leaderboard function (backward compatible)
async function getFullLeaderboard(period?: string): Promise<LeaderboardEntry[]> {
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
  getMedal
};