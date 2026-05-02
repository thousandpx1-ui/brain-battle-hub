const API_URL = "https://users.thousandpx1.workers.dev/api";

export async function saveScoreRealtime(score: number, username: string, profileFrame?: string | null) {
  await fetch(`${API_URL}/save-score`, {
    method: "POST",
    mode: 'cors',
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": "brain_battle_hub_natural-brain@battle#game$nhkvp$"
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