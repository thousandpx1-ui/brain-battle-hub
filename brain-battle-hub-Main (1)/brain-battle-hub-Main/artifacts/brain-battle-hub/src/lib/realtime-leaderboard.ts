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

export async function loadLeaderboardRealtime() {
  const res = await fetch(API_URL, { cache: "no-store", mode: 'cors' });
  return await res.json();
}