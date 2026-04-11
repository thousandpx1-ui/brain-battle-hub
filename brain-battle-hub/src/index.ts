export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 🟢 SAVE SCORE (update if higher)
    if (url.pathname === "/save-score") {
      const { userId, score } = await request.json();

      const existing = await env.DB.prepare(
        "SELECT score FROM leaderboard WHERE user_id = ?"
      ).bind(userId).first();

      if (existing) {
        if (score > existing.score) {
          await env.DB.prepare(
            "UPDATE leaderboard SET score = ?, created_at = ? WHERE user_id = ?"
          )
            .bind(score, new Date().toISOString(), userId)
            .run();
        }
      } else {
        await env.DB.prepare(
          "INSERT INTO leaderboard (user_id, username, score, created_at) VALUES (?, ?, ?, ?)"
        )
          .bind(userId, userId, score, new Date().toISOString())
          .run();
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // 🏆 GET LEADERBOARD
    if (url.pathname === "/leaderboard") {
      const { results } = await env.DB.prepare(
        "SELECT user_id as userId, score FROM leaderboard ORDER BY score DESC LIMIT 50"
      ).all();

      return new Response(JSON.stringify(results), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // root test
    if (url.pathname === "/") {
      return new Response("API running 🚀");
    }

    return new Response("Not found", { status: 404 });
  }
};