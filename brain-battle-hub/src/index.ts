import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors());
app.use('*', logger());

// Save score endpoint
app.post('/api/scores', async (c) => {
  try {
    const body = await c.req.json();
    const { user_id, username, score, game_id, profile_frame } = body;

    if (!username || typeof score !== 'number') {
      return c.json({ error: 'Invalid request body' }, 400);
    }

    const result = await c.env.DB.prepare(
      'INSERT INTO leaderboard (user_id, username, score, game_id, profile_frame) VALUES (?, ?, ?, ?, ?)'
    )
      .bind(user_id, username, score, game_id || 'unknown', profile_frame)
      .run();

    return c.json({
      id: result.meta.last_row_id,
      user_id,
      username,
      score,
      game_id: game_id || 'unknown',
      profile_frame
    });
  } catch (error) {
    console.error('Error saving score:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Legacy save score endpoint for client compatibility
app.post('/save-score', async (c) => {
  try {
    const body = await c.req.json();
    const { userId, score, profileFrame } = body;

    if (!userId || typeof score !== 'number') {
      return c.json({ error: 'Invalid request body' }, 400);
    }

    // Check if user exists
    const existing = await c.env.DB.prepare(
      "SELECT score FROM leaderboard WHERE user_id = ?"
    ).bind(userId).first();

    if (existing) {
      // Only update if new score is higher
      if (score > existing.score) {
        await c.env.DB.prepare(
          "UPDATE leaderboard SET score = ?, created_at = ?, profile_frame = ? WHERE user_id = ?"
        )
          .bind(score, new Date().toISOString(), profileFrame || null, userId)
          .run();
      }
    } else {
      // Insert new user
      await c.env.DB.prepare(
        "INSERT INTO leaderboard (user_id, username, score, game_id, profile_frame, created_at) VALUES (?, ?, ?, ?, ?, ?)"
      )
        .bind(userId, userId, score, 'unknown', profileFrame || null, new Date().toISOString())
        .run();
    }

    return c.json({
      success: true,
      userId,
      score
    });
  } catch (error) {
    console.error('Error saving score:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get all-time leaderboard (summed by user)
app.get('/api/leaderboard/all-time', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT
        username,
        SUM(score) as total_score,
        game_id,
        MAX(created_at) as latest_created_at,
        MAX(profile_frame) as profile_frame
      FROM leaderboard
      GROUP BY username
      ORDER BY total_score DESC
      LIMIT 100
    `).all();

    const leaderboard = result.results.map((row, index) => ({
      rank: index + 1,
      username: row.username,
      score: Number(row.total_score),
      gameId: row.game_id,
      createdAt: row.latest_created_at,
      profileFrame: row.profile_frame
    }));

    return c.json(leaderboard);
  } catch (error) {
    console.error('Error fetching all-time leaderboard:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get today's leaderboard (summed by user)
app.get('/api/leaderboard/today', async (c) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0]; // Get YYYY-MM-DD format

    const result = await c.env.DB.prepare(`
      SELECT
        username,
        SUM(score) as total_score,
        game_id,
        MAX(created_at) as latest_created_at,
        MAX(profile_frame) as profile_frame
      FROM leaderboard
      WHERE date(created_at) >= ?
      GROUP BY username
      ORDER BY total_score DESC
      LIMIT 100
    `).bind(todayStr).all();

    const leaderboard = result.results.map((row, index) => ({
      rank: index + 1,
      username: row.username,
      score: Number(row.total_score),
      gameId: row.game_id,
      createdAt: row.latest_created_at,
      profileFrame: row.profile_frame
    }));

    return c.json(leaderboard);
  } catch (error) {
    console.error('Error fetching today leaderboard:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Legacy endpoint for client compatibility - returns all individual entries
app.get('/leaderboard', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT user_id, username, score, game_id, created_at, profile_frame
      FROM leaderboard
      ORDER BY score DESC
      LIMIT 1000
    `).all();

    const leaderboard = result.results.map((row) => ({
      userId: row.user_id,
      username: row.username,
      score: Number(row.score),
      gameId: row.game_id,
      createdAt: row.created_at,
      profileFrame: row.profile_frame
    }));

    return c.json(leaderboard);
  } catch (error) {
    console.error('Error fetching legacy leaderboard:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok' });
});

export default app;