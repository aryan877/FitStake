import express from "express";
import { checkAdminStatus } from "../controllers/admin.controller";
import { authenticatePrivyToken } from "../middleware/auth.middleware";

const router = express.Router();

// Protected routes
router.get("/check-status", authenticatePrivyToken, checkAdminStatus);

export default router;
