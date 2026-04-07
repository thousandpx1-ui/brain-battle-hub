import { Router } from "express";
import { db, scoresTable } from "@workspace/db";
import { SubmitScoreBody } from "@workspace/api-zod";
import { desc, eq, sql, and, gte } from "drizzle-orm";

const router = Router();

router.post("/scores", async (req, res) => {
  const parsed = SubmitScoreBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const { username, gameId, score } = parsed.data;
  const [row] = await db
    .insert(scoresTable)
    .values({ username, gameId, score })
    .returning();
  res.status(201).json({
    id: row.id,
    username: row.username,
    gameId: row.gameId,
    score: row.score,
    createdAt: row.createdAt.toISOString(),
  });
});

export default router;
