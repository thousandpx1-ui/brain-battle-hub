const API_URL = "/api";

export async function saveScoreRealtime(score: number, username: string, profileFrame?: string | null) {
  await fetch(`${API_URL}/save-score`, {
    method: "POST",
    mode: 'cors',
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      userId: username,
      score: score,
      profileFrame: profileFrame || null
    })
  });
}

export async function loadLeaderboardRealtime() {
  const res = await fetch(`${API_URL}/leaderboard`, { cache: "no-store", mode: 'cors' });
  return await res.json();
}