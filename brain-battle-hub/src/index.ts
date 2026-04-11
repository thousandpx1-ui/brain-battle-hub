export class LeaderboardDO {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.clients = new Set();
  }

  async fetch(request) {
    const url = new URL(request.url);

    // 🔌 WebSocket (live updates)
    if (request.headers.get("Upgrade") === "websocket") {
      const [client, server] = Object.values(new WebSocketPair());
      server.accept();

      this.clients.add(server);

      server.addEventListener("close", () => {
        this.clients.delete(server);
      });

      return new Response(null, { status: 101, webSocket: client });
    }

    // 🟢 SAVE SCORE (update if higher)
    if (url.pathname === "/save-score") {
      const { userId, score } = await request.json();

      const existing = await this.env.DB.prepare(
        "SELECT score FROM scores WHERE userId = ?"
      ).bind(userId).first();

      if (existing) {
        if (score > existing.score) {
          await this.env.DB.prepare(
            "UPDATE scores SET score = ?, createdAt = ? WHERE userId = ?"
          )
            .bind(score, new Date().toISOString(), userId)
            .run();
        }
      } else {
        await this.env.DB.prepare(
          "INSERT INTO scores (userId, score, createdAt) VALUES (?, ?, ?)"
        )
          .bind(userId, score, new Date().toISOString())
          .run();
      }

      // 🔥 Broadcast updated leaderboard
      const { results } = await this.env.DB.prepare(
        "SELECT userId, score FROM scores ORDER BY score DESC LIMIT 50"
      ).all();

      const msg = JSON.stringify(results);
      for (const ws of this.clients) {
        ws.send(msg);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // 🏆 GET LEADERBOARD
    if (url.pathname === "/leaderboard") {
      const { results } = await this.env.DB.prepare(
        "SELECT userId, score FROM scores ORDER BY score DESC LIMIT 50"
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
}

// 🔗 Connect Durable Object
export default {
  async fetch(request, env) {
    const id = env.LEADERBOARD.idFromName("global");
    const obj = env.LEADERBOARD.get(id);

    return obj.fetch(request);
  }
};