// Cloudflare D1 Client for Leaderboard functionality

interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  gameId: string;
  createdAt: string;
  profileFrame?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://users.thousandpx1.workers.dev';

// Get or create persistent user ID
function getUserId(): string {
  let userId = localStorage.getItem("userId");
  if (!userId) {
    userId = "user_" + Math.random().toString(36).substring(2, 8);
    localStorage.setItem("userId", userId);
  }
  return userId;
}



// Save score to D1 database
async function saveScore(score: number, username?: string | null, profileFrame?: string | null): Promise<any> {

  try {
    const userId = username || getUserId();
    const finalUsername = username || userId;

    const response = await fetch(`${API_BASE_URL}/api/scores`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        username: finalUsername,
        score: score,
        game_id: 'unknown',
        profile_frame: profileFrame || null
      })
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
async function getFullLeaderboard(period) {
  if (period === "daily") {
    return getTodayLeaderboard();
  }
  return getAllTimeLeaderboard();
}

// Backward compatible alias
async function getLeaderboard() {
  return getAllTimeLeaderboard();
}

// Medal helper
function getMedal(index) {
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