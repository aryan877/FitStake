import express from "express";
import {
  createChallenge,
  getChallengeById,
  getChallenges,
  getUserChallenges,
  joinChallenge,
  updateChallengeStatus,
} from "../controllers/challenge.controller";
import { authenticatePrivyToken } from "../middleware/auth.middleware";

const router = express.Router();

// Public routes
router.get("/", getChallenges);
router.get("/:id", getChallengeById);

// Protected routes
router.get("/user/challenges", authenticatePrivyToken, getUserChallenges);
router.post("/", authenticatePrivyToken, createChallenge);
router.post("/:id/join", authenticatePrivyToken, joinChallenge);
router.patch("/:id/status", authenticatePrivyToken, updateChallengeStatus);

export default router;
