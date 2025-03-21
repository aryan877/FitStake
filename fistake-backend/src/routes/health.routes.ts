import express from "express";
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
router.post(
  "/challenges/sync-health-data",
  authenticatePrivyToken,
  (req, res) => {
    // This is a placeholder for future implementation
    res.status(200).json({
      success: true,
      message: "Health data sync initiated",
    });
  }
);

export default router;
