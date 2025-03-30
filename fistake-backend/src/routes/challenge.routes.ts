import express from "express";
import {
  claimReward,
  createChallenge,
  getChallengeById,
  getChallenges,
  getUserChallenges,
  joinChallenge,
} from "../controllers/challenge.controller";
import { authenticatePrivyToken } from "../middleware/auth.middleware";

const router = express.Router();

// Public routes
router.get("/", authenticatePrivyToken, getChallenges);
router.get("/:id", authenticatePrivyToken, getChallengeById);

// Protected routes
router.get("/user/challenges", authenticatePrivyToken, getUserChallenges);
router.post("/", authenticatePrivyToken, createChallenge);
router.post("/:id/join", authenticatePrivyToken, joinChallenge);
router.post("/:id/claim", authenticatePrivyToken, claimReward);

export default router;
