const API_URL = "https://leaderboard.thousandpx1.workers.dev/";

export async function saveScoreRealtime(score: number, username: string, profileFrame?: string | null, profileImage?: string | null) {
  await fetch(API_URL, {
    method: "POST",
    mode: 'cors',
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      userId: username,
      username: username,
      score: score,
      profileFrame: profileFrame || null,
      profileImage: profileImage || null
    })
  });
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