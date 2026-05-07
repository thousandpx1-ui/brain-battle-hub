export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    try {
      const url = new URL(request.url);

      if (request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
      }

      // 🟢 SAVE SCORE (update if higher, prevent duplicates)
      if (url.pathname === "/save-score") {
        const { userId, username, score, profileFrame, profileImage } =
          await request.json();

        const existing = await env.DB.prepare(
          "SELECT score FROM leaderboard WHERE user_id = ?",
        )
          .bind(userId)
          .first();

        if (existing) {
          // Accumulate the score
          await env.DB.prepare(
            `UPDATE leaderboard SET 
              score = MAX(score, ?), 
              username = CASE WHEN ? IS NOT NULL THEN ? ELSE username END,
              profile_frame = CASE WHEN ? = 'none' THEN NULL WHEN ? IS NOT NULL THEN ? ELSE profile_frame END, 
              profile_image = CASE WHEN ? = 'none' THEN NULL WHEN ? IS NOT NULL THEN ? ELSE profile_image END, 
              created_at = ? 
             WHERE user_id = ?`,
          )
            .bind(
              score,
              username || null,
              username || null,
              profileFrame || null,
              profileFrame || null,
              profileFrame || null,
              profileImage || null,
              profileImage || null,
              profileImage || null,
              new Date().toISOString(),
              userId,
            )
            .run();
        } else {
          await env.DB.prepare(
            "INSERT INTO leaderboard (user_id, username, score, profile_frame, profile_image, created_at, coins) VALUES (?, ?, ?, ?, ?, ?, 0)",
          )
            .bind(
              userId,
              username || userId,
              score,
              profileFrame || null,
              profileImage || null,
              new Date().toISOString(),
            )
            .run();
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // 🛠️ INIT DATABASE (Run once to create columns)
      if (url.pathname === "/init" && request.method === "POST") {
        try {
          await env.DB.prepare(
            "CREATE TABLE IF NOT EXISTS leaderboard (user_id TEXT, username TEXT, score INTEGER)",
          ).run();
        } catch (e) {}
        try {
          await env.DB.prepare(
            "CREATE TABLE IF NOT EXISTS users (id TEXT, username TEXT, score INTEGER)",
          ).run();
        } catch (e) {}
        try {
          await env.DB.prepare(
            "ALTER TABLE leaderboard ADD COLUMN score INTEGER DEFAULT 0",
          ).run();
        } catch (e) {}
        try {
          await env.DB.prepare(
            "ALTER TABLE users ADD COLUMN score INTEGER DEFAULT 0",
          ).run();
        } catch (e) {}
        try {
          await env.DB.prepare(
            "ALTER TABLE leaderboard ADD COLUMN profile_image TEXT",
          ).run();
        } catch (e) {}
        try {
          await env.DB.prepare(
            "ALTER TABLE leaderboard ADD COLUMN profile_frame TEXT",
          ).run();
        } catch (e) {}
        try {
          await env.DB.prepare(
            "ALTER TABLE leaderboard ADD COLUMN coins INTEGER DEFAULT 0",
          ).run();
        } catch (e) {}
        return new Response(
          JSON.stringify({ success: true, message: "Database initialized" }),
          {
            headers: { "Content-Type": "application/json", ...corsHeaders },
          },
        );
      }

      // 🔄 MIGRATE USER
      if (url.pathname === "/migrate-user" && request.method === "POST") {
        const { oldId, newId } = await request.json();
        if (!oldId || !newId) {
          return new Response("Missing oldId or newId", {
            status: 400,
            headers: corsHeaders,
          });
        }

        const oldRecord = await env.DB.prepare(
          "SELECT * FROM leaderboard WHERE user_id = ?"
        ).bind(oldId).first();

        if (oldRecord) {
          const newRecord = await env.DB.prepare(
            "SELECT * FROM leaderboard WHERE user_id = ?"
          ).bind(newId).first();

          if (newRecord) {
            // Merge into newId, delete oldId
            await env.DB.prepare(
              `UPDATE leaderboard SET 
                score = MAX(COALESCE(score, 0), ?),
                coins = COALESCE(coins, 0) + ?,
                profile_frame = COALESCE(profile_frame, ?),
                profile_image = COALESCE(profile_image, ?)
               WHERE user_id = ?`
            ).bind(
              oldRecord.score || 0,
              oldRecord.coins || 0,
              oldRecord.profile_frame || null,
              oldRecord.profile_image || null,
              newId
            ).run();

            await env.DB.prepare(
              "DELETE FROM leaderboard WHERE user_id = ?"
            ).bind(oldId).run();
          } else {
            // Just update oldId to newId
            await env.DB.prepare(
              "UPDATE leaderboard SET user_id = ?, username = ? WHERE user_id = ?"
            ).bind(newId, newId, oldId).run();
          }
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // 🪙 GET BALANCE
      if (url.pathname === "/balance") {
        const userId = url.searchParams.get("userId");
        if (!userId)
          return new Response("Missing userId", {
            status: 400,
            headers: corsHeaders,
          });

        const user = await env.DB.prepare(
          "SELECT coins FROM leaderboard WHERE user_id = ?",
        )
          .bind(userId)
          .first();
        return new Response(
          JSON.stringify({ coins: user ? user.coins || 0 : 0 }),
          {
            headers: { "Content-Type": "application/json", ...corsHeaders },
          },
        );
      }

      // 🪙 ADD REWARD
      if (url.pathname === "/reward" && request.method === "POST") {
        const { userId, amount } = await request.json();
        if (!userId || typeof amount !== "number")
          return new Response("Invalid input", {
            status: 400,
            headers: corsHeaders,
          });

        const existing = await env.DB.prepare(
          "SELECT user_id FROM leaderboard WHERE user_id = ?",
        )
          .bind(userId)
          .first();

        if (existing) {
          await env.DB.prepare(
            "UPDATE leaderboard SET coins = COALESCE(coins, 0) + ? WHERE user_id = ?",
          )
            .bind(amount, userId)
            .run();
        } else {
          await env.DB.prepare(
            "INSERT INTO leaderboard (user_id, username, score, coins, created_at) VALUES (?, ?, 0, ?, ?)",
          )
            .bind(userId, userId, amount, new Date().toISOString())
            .run();
        }

        return new Response(JSON.stringify({ success: true, amount }), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // 👤 CREATE USER
      if (url.pathname === "/create-user" && request.method === "POST") {
        const { id, username } = await request.json();
        if (!id)
          return new Response("Missing id", {
            status: 400,
            headers: corsHeaders,
          });

        const existing = await env.DB.prepare(
          "SELECT user_id FROM leaderboard WHERE user_id = ?",
        )
          .bind(id)
          .first();
        if (!existing) {
          await env.DB.prepare(
            "INSERT INTO leaderboard (user_id, username, score, coins, created_at) VALUES (?, ?, 0, 0, ?)",
          )
            .bind(id, username || id, new Date().toISOString())
            .run();
        } else if (username) {
          await env.DB.prepare(
            "UPDATE leaderboard SET username = ? WHERE user_id = ?",
          )
            .bind(username, id)
            .run();
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // 👤 UPDATE PROFILE (name, frame, image without changing score)
      if (url.pathname === "/update-profile" && request.method === "POST") {
        const { userId, username, profileFrame, profileImage, previousUsernames } =
          await request.json();

        if (!userId) {
          return new Response(JSON.stringify({ error: "Missing userId" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }

        await env.DB.prepare(
          "CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboard_user_id ON leaderboard(user_id)",
        ).run();

        const aliasesToMigrate = Array.isArray(previousUsernames)
          ? [...new Set(previousUsernames.filter((name) => name && name !== userId))]
          : [];

        for (const oldId of aliasesToMigrate) {
          const oldRecord = await env.DB.prepare(
            "SELECT * FROM leaderboard WHERE user_id = ?",
          ).bind(oldId).first();

          if (!oldRecord) continue;

          const newRecord = await env.DB.prepare(
            "SELECT * FROM leaderboard WHERE user_id = ?",
          ).bind(userId).first();

          if (newRecord) {
            await env.DB.prepare(
              `UPDATE leaderboard SET
                score = MAX(COALESCE(score, 0), ?),
                coins = COALESCE(coins, 0) + ?,
                profile_frame = COALESCE(profile_frame, ?),
                profile_image = COALESCE(profile_image, ?)
               WHERE user_id = ?`,
            ).bind(
              oldRecord.score || 0,
              oldRecord.coins || 0,
              oldRecord.profile_frame || null,
              oldRecord.profile_image || null,
              userId,
            ).run();

            await env.DB.prepare(
              "DELETE FROM leaderboard WHERE user_id = ?",
            ).bind(oldId).run();
          } else {
            await env.DB.prepare(
              "UPDATE leaderboard SET user_id = ? WHERE user_id = ?",
            ).bind(userId, oldId).run();
          }
        }

        await env.DB.prepare(
          `INSERT INTO leaderboard (user_id, username, score, profile_frame, profile_image, created_at, coins)
           VALUES (?, ?, 0, ?, ?, ?, 0)
           ON CONFLICT(user_id) DO UPDATE SET
             username = CASE WHEN ? IS NOT NULL THEN excluded.username ELSE leaderboard.username END,
             profile_frame = CASE WHEN excluded.profile_frame = 'none' THEN NULL WHEN excluded.profile_frame IS NOT NULL THEN excluded.profile_frame ELSE leaderboard.profile_frame END,
             profile_image = CASE WHEN excluded.profile_image = 'none' THEN NULL WHEN excluded.profile_image IS NOT NULL THEN excluded.profile_image ELSE leaderboard.profile_image END`,
        )
          .bind(
            userId,
            username || userId,
            profileFrame || null,
            profileImage || null,
            new Date().toISOString(),
            username || null,
          )
          .run();

        const updated = await env.DB.prepare(
          "SELECT user_id as userId, username, score, profile_frame as profileFrame, profile_image as profileImage, created_at as createdAt FROM leaderboard WHERE user_id = ?",
        ).bind(userId).first();

        return new Response(JSON.stringify({ success: true, user: updated }), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // 🏆 GET LEADERBOARD (deduplicated with MAX score)
      if (url.pathname === "/api/leaderboard" || url.pathname === "/leaderboard") {
        const { results } = await env.DB.prepare(
          "SELECT user_id as userId, username, MAX(score) as score, profile_frame as profileFrame, profile_image as profileImage, created_at as createdAt FROM leaderboard GROUP BY user_id ORDER BY score DESC LIMIT 50",
        ).all();
        const entries = results.map((entry) => ({
          userId: entry.userId,
          username: entry.username,
          score: entry.score,
          profileFrame: entry.profileFrame || null,
          profileImage: entry.profileImage || null,
          createdAt: entry.createdAt || null,
        }));

        return new Response(JSON.stringify(entries), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // root test
      if (url.pathname === "/") {
        return new Response(JSON.stringify({ message: "Unified API running 🚀" }), { 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        });
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
            "Cache-Control": "public, max-age=3600",
            ...corsHeaders,
          },
        });
      }

      return new Response("Not found", { status: 404, headers: corsHeaders });
    } catch (error) {
      console.error("Worker error:", error);
      return new Response(
        JSON.stringify({ error: error.message || "Internal Server Error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }
  },
};
