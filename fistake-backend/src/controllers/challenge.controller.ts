import { NextFunction, Request, Response } from "express";
import Challenge from "../models/challenge.model";
import UserModel from "../models/user.model";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";

export const getChallenges = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { type, limit = 10, page = 1 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Build query based on filters
    const query: any = { isActive: true };

    if (type) {
      query.type = type;
    }

    // Only fetch challenges
    const challenges = await Challenge.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Get total count for pagination
    const total = await Challenge.countDocuments(query);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          challenges,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / Number(limit)),
          },
        },
        "Challenges retrieved successfully"
      )
    );
  } catch (error) {
    console.error("Error fetching challenges:", error);
    return next(new ApiError(500, "Failed to fetch challenges"));
  }
};

export const getChallengeById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const challenge = await Challenge.findById(id);

    if (!challenge) {
      return next(new ApiError(404, "Challenge not found"));
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, challenge, "Challenge retrieved successfully")
      );
  } catch (error) {
    console.error("Error fetching challenge:", error);
    return next(new ApiError(500, "Failed to fetch challenge"));
  }
};

export const getUserChallenges = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new ApiError(401, "Authentication required"));
    }

    const { did } = req.user;
    const { status, limit = 10, page = 1 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

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

    // Find challenges where the user is a participant
    const query: any = {
      "participants.did": did,
      isActive: true,
    };

    if (status) {
      query["participants.$.status"] = status;
    }

    const challenges = await Challenge.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Challenge.countDocuments(query);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          challenges,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / Number(limit)),
          },
        },
        "User challenges retrieved successfully"
      )
    );
  } catch (error) {
    console.error("Error fetching user challenges:", error);
    return next(new ApiError(500, "Failed to fetch user challenges"));
  }
};

export const createChallenge = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new ApiError(401, "Authentication required"));
    }

    const { did } = req.user;

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

    const challengeData = {
      ...req.body,
      createdBy: did,
      participants: [
        {
          did,
          walletAddress: user.walletAddress,
          status: "ACTIVE",
          joinedAt: new Date(),
        },
      ],
    };

    const challenge = new Challenge(challengeData);
    await challenge.save();

    return res
      .status(201)
      .json(new ApiResponse(201, challenge, "Challenge created successfully"));
  } catch (error) {
    console.error("Error creating challenge:", error);
    return next(new ApiError(500, "Failed to create challenge"));
  }
};

export const joinChallenge = async (
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

    const challenge = await Challenge.findById(id);

    if (!challenge) {
      return next(new ApiError(404, "Challenge not found"));
    }

    // Check if the user is already a participant
    const isParticipant = challenge.participants.some(
      (participant) => participant.did === did
    );

    if (isParticipant) {
      return next(new ApiError(400, "You have already joined this challenge"));
    }

    // Add the user as a participant
    challenge.participants.push({
      did,
      walletAddress: user.walletAddress,
      status: "ACTIVE",
      joinedAt: new Date(),
    });

    // Update the pool amount
    challenge.poolAmount += challenge.stake.amount;

    await challenge.save();

    return res
      .status(200)
      .json(new ApiResponse(200, challenge, "Successfully joined challenge"));
  } catch (error) {
    console.error("Error joining challenge:", error);
    return next(new ApiError(500, "Failed to join challenge"));
  }
};

export const updateChallengeStatus = async (
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
    const { status } = req.body;

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

    if (!["ACTIVE", "COMPLETED", "FAILED"].includes(status)) {
      return next(new ApiError(400, "Invalid status"));
    }

    const challenge = await Challenge.findById(id);

    if (!challenge) {
      return next(new ApiError(404, "Challenge not found"));
    }

    // Find the user's participation record
    const participantIndex = challenge.participants.findIndex(
      (participant) => participant.did === did
    );

    if (participantIndex === -1) {
      return next(
        new ApiError(400, "You are not a participant in this challenge")
      );
    }

    // Update the status
    challenge.participants[participantIndex].status = status as
      | "ACTIVE"
      | "COMPLETED"
      | "FAILED";

    // If the status is 'COMPLETED', increment the completedCount
    if (status === "COMPLETED") {
      challenge.completedCount += 1;
    }

    await challenge.save();

    return res
      .status(200)
      .json(
        new ApiResponse(200, challenge, "Challenge status updated successfully")
      );
  } catch (error) {
    console.error("Error updating challenge status:", error);
    return next(new ApiError(500, "Failed to update challenge status"));
  }
};
