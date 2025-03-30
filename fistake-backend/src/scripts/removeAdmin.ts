#!/usr/bin/env ts-node

/**
 * Script to remove admin privileges from a user by username or wallet address
 * Usage: ts-node removeAdmin.ts <username or wallet address>
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import UserModel from "../models/user.model";

dotenv.config();

const args = process.argv.slice(2);

if (args.length !== 1) {
  console.error("Usage: ts-node removeAdmin.ts <username or wallet address>");
  process.exit(1);
}

const userIdentifier = args[0];

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/fitstake")
  .then(async () => {
    console.log("Connected to MongoDB");

    try {
      // Find user by username or wallet address
      const user = await UserModel.findOne({
        $or: [{ username: userIdentifier }, { walletAddress: userIdentifier }],
      });

      if (!user) {
        console.error("User not found with identifier:", userIdentifier);
        process.exit(1);
      }

      if (!user.isAdmin) {
        console.log("User is not currently an admin.");
        process.exit(0);
      }

      // Remove admin privileges
      user.isAdmin = false;
      await user.save();

      console.log(
        "Admin privileges removed successfully from user:",
        userIdentifier
      );
      process.exit(0);
    } catch (error) {
      console.error("Error removing admin privileges:", error);
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
