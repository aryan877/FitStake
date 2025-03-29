import { NextFunction, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import BadgeModel from "../models/badge.model";
import UserModel from "../models/user.model";
import { BadgeWithDetails } from "../types";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import { validateUsername } from "../utils/validators";

export const getUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) return next(new ApiError(401, "Authentication required"));

    const { did } = req.user;
    const user = await UserModel.findOne({ privyId: did });
    if (!user) return next(new ApiError(404, "User not found"));

    // Get badge details
    let badgesWithDetails: BadgeWithDetails[] = [];
    if (user.badges && user.badges.length > 0) {
      const badgeIds = user.badges.map((badge) => badge.badgeId);
      const badgeDetails = await BadgeModel.find({ id: { $in: badgeIds } });

      badgesWithDetails = user.badges.map((userBadge) => {
        const badge = badgeDetails.find((b) => b.id === userBadge.badgeId);
        return {
          id: userBadge.badgeId,
          name: badge?.name || "Unknown Badge",
          description: badge?.description || "",
          iconName: badge?.iconName || "",
          tier: badge?.tier || "bronze",
          category: badge?.category || "challenges",
          earnedAt: userBadge.earnedAt,
        };
      });
    }

    const profileData = {
      privyId: user.privyId,
      walletAddress: user.walletAddress,
      username: user.username,
      isAdmin: user.isAdmin || false,
      stats: user.stats || {
        totalStepCount: 0,
        challengesCompleted: 0,
        challengesJoined: 0,
        challengesCreated: 0,
        totalStaked: 0,
        totalEarned: 0,
        winRate: 0,
      },
      badges: badgesWithDetails,
    };

    return res
      .status(200)
      .json(
        new ApiResponse(200, profileData, "User profile retrieved successfully")
      );
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return next(new ApiError(500, "Error fetching user profile"));
  }
};

export const createOrUpdateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) return next(new ApiError(401, "Authentication required"));

    const { did } = req.user;
    const { walletAddress, username } = req.body;

    if (!walletAddress)
      return next(new ApiError(400, "Wallet address is required"));

    // Validate username
    if (username && !validateUsername(username)) {
      return next(
        new ApiError(
          400,
          "Username must be 3-20 alphanumeric characters or underscores"
        )
      );
    }

    const generatedUsername = username || `user_${uuidv4().substring(0, 8)}`;
    let user = await UserModel.findOne({ privyId: did });

    if (user) {
      // Update existing user
      if (user.walletAddress !== walletAddress) {
        user.walletAddress = walletAddress;
      }

      if (username && user.username !== username) {
        const existingUser = await UserModel.findOne({
          username,
          privyId: { $ne: did },
        });

        if (existingUser)
          return next(new ApiError(400, "Username already taken"));
        user.username = username;
      }
      await user.save();
    } else {
      // Create new user
      user = await UserModel.create({
        privyId: did,
        walletAddress,
        username: generatedUsername,
        isAdmin: false,
        stats: {
          totalStepCount: 0,
          challengesCompleted: 0,
          challengesJoined: 0,
          challengesCreated: 0,
          totalStaked: 0,
          totalEarned: 0,
          winRate: 0,
          lastUpdated: new Date(),
        },
      });
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          privyId: user.privyId,
          walletAddress: user.walletAddress,
          username: user.username,
          isAdmin: user.isAdmin || false,
          stats: user.stats,
          badges: user.badges || [],
        },
        "User profile updated successfully"
      )
    );
  } catch (error) {
    console.error("User creation/update error:", error);
    return next(new ApiError(500, "Error saving user data"));
  }
};

export const checkUsername = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { username } = req.query;

    if (!username || typeof username !== "string") {
      return next(new ApiError(400, "Username is required"));
    }

    if (!validateUsername(username)) {
      return next(
        new ApiError(
          400,
          "Username must be 3-20 alphanumeric characters or underscores"
        )
      );
    }

    const existingUser = await UserModel.findOne({ username });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          isAvailable: !existingUser,
          username,
        },
        "Username availability checked successfully"
      )
    );
  } catch (error) {
    console.error("Username check error:", error);
    return next(new ApiError(500, "Error checking username availability"));
  }
};

export const updateUsername = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) return next(new ApiError(401, "Authentication required"));

    const { did } = req.user;
    const { username } = req.body;

    if (!username || typeof username !== "string") {
      return next(new ApiError(400, "Username is required"));
    }

    if (!validateUsername(username)) {
      return next(
        new ApiError(
          400,
          "Username must be 3-20 alphanumeric characters or underscores"
        )
      );
    }

    const user = await UserModel.findOne({ privyId: did });
    if (!user) return next(new ApiError(404, "User not found"));

    // No change needed
    if (user.username === username) {
      return res.status(200).json(
        new ApiResponse(
          200,
          {
            privyId: user.privyId,
            username: user.username,
          },
          "Username is unchanged"
        )
      );
    }

    // Check if username is taken
    const existingUser = await UserModel.findOne({
      username,
      privyId: { $ne: did },
    });

    if (existingUser) return next(new ApiError(400, "Username already taken"));

    user.username = username;
    await user.save();

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          privyId: user.privyId,
          username: user.username,
          success: true,
        },
        "Username updated successfully"
      )
    );
  } catch (error) {
    console.error("Username update error:", error);
    return next(new ApiError(500, "Error updating username"));
  }
};
