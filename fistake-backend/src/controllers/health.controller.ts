import { NextFunction, Request, Response } from "express";
import Challenge from "../models/challenge.model";
import UserModel from "../models/user.model";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";

/**
 * Submits health data for a user's challenge
 * This endpoint allows users to update their fitness progress for a specific challenge
 */
export const submitHealthData = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new ApiError(401, "Authentication required"));
    }

    const { did } = req.user;
    const { id } = req.params;
    const { healthData, progress, isCompleted } = req.body;

    // Verify user has wallet address
    const user = await UserModel.findOne({ privyId: did });
    if (!user || !user.walletAddress) {
      return next(
        new ApiError(
          400,
          "Wallet address not set. Please connect your wallet first."
        )
      );
    }

    // Find the challenge
    const challenge = await Challenge.findById(id);

    if (!challenge) {
      return next(new ApiError(404, "Challenge not found"));
    }

    // Find the user's participant record
    const participantIndex = challenge.participants.findIndex(
      (p) => p.walletAddress === user.walletAddress
    );

    if (participantIndex === -1) {
      return next(
        new ApiError(400, "You are not a participant in this challenge")
      );
    }

    // Update health data
    challenge.participants[participantIndex].healthData = healthData;
    challenge.participants[participantIndex].progress = progress;

    // If completed, mark as completed. The on-chain verification will happen via admin completion
    if (isCompleted) {
      challenge.participants[participantIndex].completed = true;
    }

    await challenge.save();

    return res
      .status(200)
      .json(
        new ApiResponse(200, challenge, "Health data submitted successfully")
      );
  } catch (error) {
    console.error("Error submitting health data:", error);
    return next(new ApiError(500, "Failed to submit health data"));
  }
};

/**
 * Gets the current progress for a user in a challenge
 * This endpoint retrieves health data, completion status, and reward claim status
 */
export const getProgress = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new ApiError(401, "Authentication required"));
    }

    const { did } = req.user;
    const { id } = req.params;

    // Verify user has wallet address
    const user = await UserModel.findOne({ privyId: did });
    if (!user || !user.walletAddress) {
      return next(
        new ApiError(
          400,
          "Wallet address not set. Please connect your wallet first."
        )
      );
    }

    // Find the challenge
    const challenge = await Challenge.findById(id);

    if (!challenge) {
      return next(new ApiError(404, "Challenge not found"));
    }

    // Find the user's participant record
    const participant = challenge.participants.find(
      (p) => p.walletAddress === user.walletAddress
    );

    if (!participant) {
      return next(
        new ApiError(400, "You are not a participant in this challenge")
      );
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          progress: participant.progress || 0,
          completed: participant.completed,
          claimed: participant.claimed,
          healthData: participant.healthData || [],
        },
        "Challenge progress retrieved successfully"
      )
    );
  } catch (error) {
    console.error("Error getting challenge progress:", error);
    return next(new ApiError(500, "Failed to get challenge progress"));
  }
};
