import express from "express";
import {
  checkUsername,
  createOrUpdateUser,
  getUserProfile,
} from "../controllers/auth.controller";
import { authenticatePrivyToken } from "../middleware/auth.middleware";

const router = express.Router();

// Protected routes
router.post("/user", authenticatePrivyToken, createOrUpdateUser);
router.get("/user", authenticatePrivyToken, getUserProfile);
router.get("/check-username", checkUsername);

export default router;
