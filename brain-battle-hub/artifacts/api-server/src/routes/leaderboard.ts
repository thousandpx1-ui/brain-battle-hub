import { Router } from "express";
import { db, scoresTable } from "@workspace/db";
import { GetLeaderboardQueryParams, GetPlayerRankQueryParams } from "@workspace/api-zod";
import { desc, eq, sql, and, gte, count } from "drizzle-orm";

const router = Router();

router.get("/leaderboard", async (req, res) => {
  const parsed = GetLeaderboardQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }
  const { gameId, period, limit: limitParam } = parsed.data;
  // Use a very high default limit to show all scores
  const limitVal = limitParam ?? 10000;

  let query = db
    .select({
      username: scoresTable.username,
      gameId: scoresTable.gameId,
      score: scoresTable.score,
      createdAt: scoresTable.createdAt,
    })
    .from(scoresTable)
    .$dynamic();

  const conditions = [];
  if (gameId) conditions.push(eq(scoresTable.gameId, gameId));
  if (period === "daily") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    conditions.push(gte(scoresTable.createdAt, today));
  }
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const rows = await query.orderBy(desc(scoresTable.score)).limit(limitVal);

  const entries = rows.map((r, i) => ({
    rank: i + 1,
    username: r.username,
    gameId: r.gameId,
    score: r.score,
    createdAt: r.createdAt.toISOString(),
  }));

  res.json(entries);
});

router.get("/leaderboard/stats", async (_req, res) => {
  const totalResult = await db
    .select({ total: sql<number>`count(distinct username)` })
    .from(scoresTable);
  const totalPlayers = Number(totalResult[0]?.total ?? 0);

  const topScoreResult = await db
    .select({ top: sql<number>`max(score)` })
    .from(scoresTable);
  const topScore = Number(topScoreResult[0]?.top ?? 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const gamesTodayResult = await db
    .select({ cnt: count() })
    .from(scoresTable)
    .where(gte(scoresTable.createdAt, today));
  const gamesToday = Number(gamesTodayResult[0]?.cnt ?? 0);

  const topGameResult = await db
    .select({ gameId: scoresTable.gameId, cnt: count() })
    .from(scoresTable)
    .groupBy(scoresTable.gameId)
    .orderBy(desc(count()))
    .limit(1);
  const topGame = topGameResult[0]?.gameId ?? "memory";

  res.json({ totalPlayers, topScore, gamesToday, topGame });
});

router.get("/leaderboard/rank", async (req, res) => {
  const parsed = GetPlayerRankQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }
  const { username } = parsed.data;

  const bestScoreResult = await db
    .select({ score: sql<number>`max(score)` })
    .from(scoresTable)
    .where(eq(scoresTable.username, username));
  const bestScore = Number(bestScoreResult[0]?.score ?? 0);

  const gamesPlayedResult = await db
    .select({ cnt: count() })
    .from(scoresTable)
    .where(eq(scoresTable.username, username));
  const gamesPlayed = Number(gamesPlayedResult[0]?.cnt ?? 0);

  const aboveResult = await db
    .select({ cnt: sql<number>`count(distinct username)` })
    .from(scoresTable)
    .where(sql`score > ${bestScore}`);
  const aboveCount = Number(aboveResult[0]?.cnt ?? 0);

  const totalResult = await db
    .select({ total: sql<number>`count(distinct username)` })
    .from(scoresTable);
  const totalPlayers = Number(totalResult[0]?.total ?? 1);

  const rank = aboveCount + 1;
  const percentile = totalPlayers > 0 ? ((totalPlayers - rank + 1) / totalPlayers) * 100 : 100;

  let badge: "bronze" | "silver" | "gold" = "bronze";
  if (percentile >= 90) badge = "gold";
  else if (percentile >= 75) badge = "silver";

  res.json({
    username,
    rank,
    totalPlayers,
    percentile: Math.round(percentile),
    badge,
    bestScore,
    gamesPlayed,
  });
});

export default router;
