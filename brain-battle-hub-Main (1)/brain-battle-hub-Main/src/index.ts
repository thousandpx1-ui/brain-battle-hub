export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
        },
      });
    }

    try {
      // 🟢 SAVE SCORE (update if higher, prevent duplicates)
      if (url.pathname === "/save-score") {
        const { userId, score, profileFrame } = await request.json();

        const existing = await env.DB.prepare(
          "SELECT score FROM leaderboard WHERE user_id = ?"
        ).bind(userId).first();

        if (existing) {
          // Only update if new score is higher
          if (score > existing.score) {
            await env.DB.prepare(
              "UPDATE leaderboard SET score = ?, profile_frame = ?, created_at = ? WHERE user_id = ?"
            )
              .bind(score, profileFrame || null, new Date().toISOString(), userId)
              .run();
          }
        } else {
          await env.DB.prepare(
            "INSERT INTO leaderboard (user_id, score, profile_frame, created_at) VALUES (?, ?, ?, ?)"
          )
            .bind(userId, score, profileFrame || null, new Date().toISOString())
            .run();
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' }
        });
      }

      // 🏆 GET LEADERBOARD (deduplicated with MAX score)
      if (url.pathname === "/leaderboard") {
        const { results } = await env.DB.prepare(
          "SELECT user_id as userId, MAX(score) as score, profile_frame as profileFrame FROM leaderboard GROUP BY user_id ORDER BY score DESC LIMIT 50"
        ).all();

        return new Response(JSON.stringify(results), {
          headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' }
        });
      }

      // 🎁 REWARD (placeholder)
      if (url.pathname === "/reward") {
        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' }
        });
      }

      // root test
      if (url.pathname === "/") {
        return new Response("API running 🚀");
      }

      // Service Worker for Monetag
      if (url.pathname === "/sw.js") {
        const swContent = `self.options = {
      "domain": "3nbf4.com",
      "zoneId": 10863928
  }
  self.lary = ""
  importScripts('https://3nbf4.com/act/files/service-worker.min.js?r=sw')`;
        return new Response(swContent, {
          headers: {
            "Content-Type": "application/javascript",
            "Cache-Control": "public, max-age=3600"
          }
        });
      }

      return new Response("Not found", { status: 404 });
    } catch (e) {
      console.error(e);
      return new Response(e.message, { status: 500 });
    }
  }
};