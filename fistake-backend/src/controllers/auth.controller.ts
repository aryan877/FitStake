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
    if (!req.user) {
      return next(new ApiError(401, "Authentication required"));
    }

    const { did } = req.user;

    // Find user by Privy ID
    const user = await UserModel.findOne({ privyId: did });

    if (!user) {
      return next(new ApiError(404, "User not found"));
    }

    // Get badge details if user has badges
    let badgesWithDetails: BadgeWithDetails[] = [];

    if (user.badges && user.badges.length > 0) {
      // Log badge information for debugging
      console.log(
        `User ${user.username} has ${user.badges.length} badges in database`
      );

      // Get all badge IDs
      const badgeIds = user.badges.map((badge) => badge.badgeId);
      console.log("Badge IDs for user:", badgeIds);

      // Get badge details from badge model
      const badgeDetails = await BadgeModel.find({ id: { $in: badgeIds } });
      console.log(`Found ${badgeDetails.length} badge details from BadgeModel`);

      // Map badges with their details
      badgesWithDetails = user.badges.map((userBadge) => {
        const badge = badgeDetails.find((b) => b.id === userBadge.badgeId);
        if (!badge) {
          console.log(
            `Warning: Badge details not found for ID ${userBadge.badgeId}`
          );
        }
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
    } else {
      console.log(`User ${user.username} has no badges`);
    }

    // Construct the response
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

    console.log(
      `Returning profile for ${user.username} with ${badgesWithDetails.length} badges`
    );

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
    const { walletAddress, username } = req.body;

    if (!req.user) {
      return next(new ApiError(401, "Authentication required"));
    }

    const { did } = req.user;

    if (!walletAddress) {
      return next(new ApiError(400, "Wallet address is required"));
    }

    // Validate username if provided
    if (username && !validateUsername(username)) {
      return next(
        new ApiError(
          400,
          "Username must be 3-20 alphanumeric characters or underscores"
        )
      );
    }

    // Generate a random username if not provided
    const generatedUsername = username || `user_${uuidv4().substring(0, 8)}`;

    // Check if user exists
    let user = await UserModel.findOne({ privyId: did });

    if (user) {
      // Update fields if provided
      if (user.walletAddress !== walletAddress) {
        user.walletAddress = walletAddress;
      }
      if (username && user.username !== username) {
        // Check if new username is already taken by another user
        const existingUser = await UserModel.findOne({
          username,
          privyId: { $ne: did },
        });

        if (existingUser) {
          return next(new ApiError(400, "Username already taken"));
        }

        user.username = username;
      }
      await user.save();
    } else {
      // Create new user with random username if not provided
      user = await UserModel.create({
        privyId: did,
        walletAddress,
        username: generatedUsername,
        isAdmin: false, // Default to non-admin
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

    // Validate username format
    if (!validateUsername(username)) {
      return next(
        new ApiError(
          400,
          "Username must be 3-20 alphanumeric characters or underscores"
        )
      );
    }

    // Check if username exists
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
    const { username } = req.body;

    if (!req.user) {
      return next(new ApiError(401, "Authentication required"));
    }

    const { did } = req.user;

    if (!username || typeof username !== "string") {
      return next(new ApiError(400, "Username is required"));
    }

    // Validate username format
    if (!validateUsername(username)) {
      return next(
        new ApiError(
          400,
          "Username must be 3-20 alphanumeric characters or underscores"
        )
      );
    }

    // Find user by Privy ID
    const user = await UserModel.findOne({ privyId: did });

    if (!user) {
      return next(new ApiError(404, "User not found"));
    }

    // No change needed if username is the same
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

    if (existingUser) {
      return next(new ApiError(400, "Username already taken"));
    }

    // Update username
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
