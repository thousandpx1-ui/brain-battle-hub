export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 🟢 SAVE SCORE (update if higher, prevent duplicates)
    if (url.pathname === "/save-score") {
      const { userId, score, profileFrame, profileImage } = await request.json();

      try {
        await env.DB.prepare("ALTER TABLE leaderboard ADD COLUMN profile_image TEXT").run();
      } catch (e) {
        // Ignore error if column already exists
      }
      
      try {
        await env.DB.prepare("ALTER TABLE leaderboard ADD COLUMN profile_frame TEXT").run();
      } catch (e) {
        // Ignore error if column already exists
      }

      const existing = await env.DB.prepare(
        "SELECT score FROM leaderboard WHERE user_id = ?"
      ).bind(userId).first();

      if (existing) {
        // Only update if new score is higher
        if (score > existing.score) {
          await env.DB.prepare(
            `UPDATE leaderboard SET 
              score = ?, 
              profile_frame = CASE WHEN ? = 'none' THEN NULL WHEN ? IS NOT NULL THEN ? ELSE profile_frame END, 
              profile_image = CASE WHEN ? = 'none' THEN NULL WHEN ? IS NOT NULL THEN ? ELSE profile_image END, 
              created_at = ? 
             WHERE user_id = ?`
          )
            .bind(
              score, 
              profileFrame || null, profileFrame || null, profileFrame || null,
              profileImage || null, profileImage || null, profileImage || null,
              new Date().toISOString(), 
              userId
            )
            .run();
        } else {
          // Even if score is not higher, update profile settings if provided
          await env.DB.prepare(
            `UPDATE leaderboard SET 
              profile_frame = CASE WHEN ? = 'none' THEN NULL WHEN ? IS NOT NULL THEN ? ELSE profile_frame END, 
              profile_image = CASE WHEN ? = 'none' THEN NULL WHEN ? IS NOT NULL THEN ? ELSE profile_image END 
             WHERE user_id = ?`
          )
            .bind(
              profileFrame || null, profileFrame || null, profileFrame || null,
              profileImage || null, profileImage || null, profileImage || null,
              userId
            )
            .run();
        }
      } else {
        await env.DB.prepare(
          "INSERT INTO leaderboard (user_id, username, score, profile_frame, profile_image, created_at) VALUES (?, ?, ?, ?, ?, ?)"
        )
          .bind(userId, userId, score, profileFrame || null, profileImage || null, new Date().toISOString())
          .run();
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // 🏆 GET LEADERBOARD (deduplicated with MAX score)
    if (url.pathname === "/leaderboard") {
      try {
        await env.DB.prepare("ALTER TABLE leaderboard ADD COLUMN profile_image TEXT").run();
      } catch (e) {
        // Ignore
      }
      
      try {
        await env.DB.prepare("ALTER TABLE leaderboard ADD COLUMN profile_frame TEXT").run();
      } catch (e) {
        // Ignore
      }
      
      const { results } = await env.DB.prepare(
        "SELECT user_id as userId, MAX(score) as score, profile_frame as profileFrame, profile_image as profileImage FROM leaderboard GROUP BY user_id ORDER BY score DESC LIMIT 50"
      ).all();

      return new Response(JSON.stringify(results), {
        headers: { "Content-Type": "application/json" }
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
    "zoneId": 10900395
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
  }
};