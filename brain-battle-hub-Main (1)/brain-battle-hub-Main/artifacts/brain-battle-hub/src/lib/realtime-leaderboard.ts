const API_URL = "https://leaderboard.thousandpx1.workers.dev";

export async function saveScoreRealtime(score: number, username: string, profileFrame?: string | null, profileImage?: string | null) {
  const res = await fetch(`${API_URL}/save-score`, {
    method: "POST",
    mode: 'cors',
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      userId: username,
      score: score,
      profileFrame: profileFrame || null,
      profileImage: profileImage || null
    })
  });

  if (!res.ok) {
    throw new Error(`Failed to save realtime score: ${res.status}`);
  }
}

export async function loadLeaderboardRealtime() {
  const res = await fetch(`${API_URL}/leaderboard`);
  if (!res.ok) {
    throw new Error(`Failed to load realtime leaderboard: ${res.status}`);
  }
  return await res.json();
}

export async function purchaseFrame(userId: string, frame: string) {
  const res = await fetch(`${API_URL}/purchase-frame`, {
    method: "POST",
    mode: 'cors',
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      userId,
      frame
    })
  });
  return await res.json();
}