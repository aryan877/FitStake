import { NextFunction, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import UserModel from "../models/user.model";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";

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

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          privyId: user.privyId,
          walletAddress: user.walletAddress,
          username: user.username,
        },
        "User profile retrieved successfully"
      )
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
        user.username = username;
      }
      await user.save();
    } else {
      // Create new user with random username if not provided
      user = await UserModel.create({
        privyId: did,
        walletAddress,
        username: generatedUsername,
      });
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          privyId: user.privyId,
          walletAddress: user.walletAddress,
          username: user.username,
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

    // Check if username exists
    const existingUser = await UserModel.findOne({ username });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          available: !existingUser,
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
