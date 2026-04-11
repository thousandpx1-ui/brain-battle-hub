const API_URL = "https://mute-art-58b0.thousandpx1.workers.dev";

export async function saveScoreRealtime(score: number, userId: string, username?: string) {
  const payload = {
    userId: userId,
    username: username || userId,
    score: score
  };
  console.log('📤 saveScoreRealtime - SENDING:', payload);
  
  const response = await fetch(`${API_URL}/save-score`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  
  console.log('📥 saveScoreRealtime - Response status:', response.status);
  const result = await response.json();
  console.log('📥 saveScoreRealtime - Response body:', result);
}

export async function loadLeaderboardRealtime() {
  console.log('📥 Loading leaderboard from:', `${API_URL}/leaderboard`);
  const res = await fetch(`${API_URL}/leaderboard`, { cache: "no-store" });
  const data = await res.json();
  console.log('📊 Leaderboard RAW data from backend:', data);
  console.log('📊 First entry structure:', data[0]);
  return data;
}