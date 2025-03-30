import { Router } from "express";
import { getAllTimeLeaderboard } from "../controllers/leaderboard.controller";

const router = Router();

router.get("/all-time", getAllTimeLeaderboard);

export default router;
