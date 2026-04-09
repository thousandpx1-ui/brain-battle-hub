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

    const response = await fetch(`${API_BASE_URL}/api/scores`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        username: finalUsername,
        score: score,
        game_id: 'unknown'
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
    const response = await fetch(`${API_BASE_URL}/api/leaderboard/all-time`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('All-time leaderboard:', data.length, 'entries');
    return data;
  } catch (error) {
    console.error('Error fetching all-time leaderboard:', error);
    return [];
  }
}

// Get today's leaderboard
async function getTodayLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/leaderboard/today`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Today leaderboard:', data.length, 'entries');
    return data;
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