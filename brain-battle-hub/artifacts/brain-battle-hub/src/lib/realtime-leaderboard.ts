const API_URL = "https://mute-art-58b0.thousandpx1.workers.dev";

export async function saveScoreRealtime(score: number, username: string) {
  await fetch(`${API_URL}/save-score`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      userId: username,
      score: score
    })
  });
}

export async function loadLeaderboardRealtime() {
  const res = await fetch(`${API_URL}/leaderboard`, { cache: "no-store" });
  return await res.json();
}