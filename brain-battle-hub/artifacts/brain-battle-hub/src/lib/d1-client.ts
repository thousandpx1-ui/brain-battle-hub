// Cloudflare D1 Client for Leaderboard functionality

interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  gameId: string;
  createdAt: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://mute-art-58b0.thousandpx1.workers.dev';

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
    const userId = username || "guest_" + Date.now();
    const finalUsername = username || "guest_" + Date.now();

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

    // Transform the response to match expected format
    return data.map((entry: any, index: number) => ({
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

    // Filter for today's entries
    const today = new Date().toDateString();
    const todayData = allData.filter((entry: any) =>
      new Date(entry.createdAt).toDateString() === today
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