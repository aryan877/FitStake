import express from "express";
import { claimReward } from "../controllers/challenge.controller";
import {
  getProgress,
  submitHealthData,
} from "../controllers/health.controller";
import { authenticatePrivyToken } from "../middleware/auth.middleware";

const router = express.Router();

// Protected routes for users
router.post(
  "/challenges/:id/health-data",
  authenticatePrivyToken,
  submitHealthData
);
router.get("/challenges/:id/progress", authenticatePrivyToken, getProgress);
router.post("/challenges/:id/claim", authenticatePrivyToken, claimReward);

export default router;
