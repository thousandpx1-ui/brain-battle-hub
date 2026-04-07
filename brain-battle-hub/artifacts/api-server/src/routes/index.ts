import { Router, type IRouter } from "express";
import healthRouter from "./health";
import scoresRouter from "./scores";
import leaderboardRouter from "./leaderboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(scoresRouter);
router.use(leaderboardRouter);

export default router;
