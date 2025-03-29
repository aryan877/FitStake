import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { NextFunction, Request, Response } from "express";
import Challenge from "../models/challenge.model";
import UserModel from "../models/user.model";
import badgeService from "../services/badge.service";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";

export const getChallenges = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      type,
      limit = 10,
      page = 1,
      minStake,
      maxStake,
      minGoal,
      maxGoal,
      minParticipants,
      maxParticipants,
      sortBy = "createdAt",
      sortOrder = "desc",
      status,
      searchText = "",
      visibility = "public",
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // Build sort options
    const sortDirection = sortOrder === "asc" ? 1 : -1;
    const sortOptions: any = {};
    sortOptions[sortBy as string] = sortDirection;

    // Build query
    let query: any = {};

    // Filter by visibility
    if (visibility === "public") {
      query.isPublic = true;
    } else if (visibility === "private") {
      query.isPublic = false;
    }

    // Handle search
    if (searchText) {
      const trimmedSearchText = String(searchText).trim();

      if (trimmedSearchText.length > 0) {
        // Check for exact challengeId match first
        const exactMatch = await Challenge.findOne({
          challengeId: trimmedSearchText,
        });

        if (exactMatch) {
          // Override all filters for exact match
          query = { challengeId: trimmedSearchText };
        } else {
          // Fallback to pattern matching
          const searchRegex = new RegExp(trimmedSearchText, "i");
          query.$or = [
            { challengeId: { $regex: searchRegex } },
            { title: { $regex: searchRegex } },
            { description: { $regex: searchRegex } },
          ];

          // Add text search for multi-word queries
          if (
            trimmedSearchText.includes(" ") &&
            trimmedSearchText.length >= 3
          ) {
            if (!query.$or) query.$or = [];
            query.$or.push({ $text: { $search: trimmedSearchText } });
            sortOptions.score = { $meta: "textScore" };
          }
        }
      }
    }

    // Add other filters
    if (type) query.type = type;

    // Status filter
    if (status === "active") query.isCompleted = false;
    else if (status === "completed") query.isCompleted = true;

    // Stake amount range filter
    if (minStake || maxStake) {
      query.stakeAmount = {};
      if (minStake) {
        query.stakeAmount.$gte = Number(minStake) * LAMPORTS_PER_SOL;
      }
      if (maxStake) {
        query.stakeAmount.$lte = Number(maxStake) * LAMPORTS_PER_SOL;
      }
    }

    // Goal range filter
    if (minGoal || maxGoal) {
      query["goal.value"] = {};
      if (minGoal) query["goal.value"].$gte = Number(minGoal);
      if (maxGoal) query["goal.value"].$lte = Number(maxGoal);
    }

    // Participant count filter
    if (minParticipants || maxParticipants) {
      query.participantCount = {};
      if (minParticipants)
        query.participantCount.$gte = Number(minParticipants);
      if (maxParticipants)
        query.participantCount.$lte = Number(maxParticipants);
    }

    // Execute query
    const challenges = await Challenge.find(query)
      .sort(sortOptions)
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
        "Challenges retrieved successfully"
      )
    );
  } catch (error) {
    console.error("Error fetching challenges:", error);
    return next(new ApiError(500, "Failed to fetch challenges"));
  }
};

// Get a single challenge by ID
export const getChallengeById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const challenge = await Challenge.findById(id);

    if (!challenge) return next(new ApiError(404, "Challenge not found"));

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

// Get challenges for the current user
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
      "participants.walletAddress": user.walletAddress,
    };

    // If status is specified, filter by status
    if (status === "COMPLETED") {
      query["participants.completed"] = true;
    } else if (status === "ACTIVE") {
      query["participants.completed"] = false;
      query.isCompleted = false;
    } else if (status === "FAILED") {
      query.isCompleted = true;
      query["participants.completed"] = false;
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

// Create a new challenge
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
    const {
      challengeId,
      solanaChallengePda,
      solanaVaultPda,
      title,
      description,
      type,
      goal,
      startTime,
      endTime,
      stakeAmount,
      minParticipants,
      maxParticipants,
      token,
      solanaTxId,
      isPublic = false,
    } = req.body;

    // Validate required fields
    if (
      !challengeId ||
      !solanaChallengePda ||
      !solanaVaultPda ||
      !title ||
      !description ||
      !type ||
      !goal ||
      !startTime ||
      !endTime ||
      !stakeAmount ||
      !minParticipants ||
      !maxParticipants
    ) {
      return next(new ApiError(400, "Missing required fields"));
    }

    // Validate title and description length
    const MAX_TITLE_LENGTH = 50;
    const MAX_DESCRIPTION_LENGTH = 250;

    if (title.length > MAX_TITLE_LENGTH) {
      return next(
        new ApiError(
          400,
          `Title must be ${MAX_TITLE_LENGTH} characters or less`
        )
      );
    }

    if (description.length > MAX_DESCRIPTION_LENGTH) {
      return next(
        new ApiError(
          400,
          `Description must be ${MAX_DESCRIPTION_LENGTH} characters or less`
        )
      );
    }

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

    // Check if attempting to create a public challenge
    if (isPublic === true) {
      // Only admins can create public challenges
      if (!user.isAdmin) {
        return next(
          new ApiError(403, "Only administrators can create public challenges")
        );
      }
    }

    // Create new challenge
    const challenge = new Challenge({
      challengeId,
      solanaChallengePda,
      solanaVaultPda,
      authority: user.walletAddress,
      admin: user.walletAddress,
      title,
      description,
      type,
      goal,
      startTime,
      endTime,
      stakeAmount,
      minParticipants,
      maxParticipants,
      token: token || "SOL",
      isActive: true,
      isCompleted: false,
      participantCount: 0,
      totalStake: 0,
      participants: [],
      lastIndexedTransaction: solanaTxId,
      lastEventTimestamp: new Date(),
      isPublic: isPublic,
    });

    await challenge.save();

    // Update user stats for creating a challenge
    if (user._id) {
      // Initialize stats if they don't exist
      if (!user.stats) {
        user.stats = {
          totalStepCount: 0,
          challengesCompleted: 0,
          challengesJoined: 0,
          challengesCreated: 0,
          totalStaked: 0,
          totalEarned: 0,
          winRate: 0,
          lastUpdated: new Date(),
        };
      }

      // Update stats
      user.stats.challengesCreated = (user.stats.challengesCreated || 0) + 1;
      user.stats.lastUpdated = new Date();

      await user.save();

      // Check badge count before
      const badgeCountBefore = user.badges?.length || 0;

      // Check for new badges
      const newBadges = await badgeService.checkAndAwardBadges(
        user._id.toString()
      );
    }

    return res
      .status(201)
      .json(new ApiResponse(201, challenge, "Challenge created successfully"));
  } catch (error) {
    console.error("Error creating challenge:", error);
    return next(new ApiError(500, "Failed to create challenge"));
  }
};

// Join a challenge
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

    // Find the challenge
    const challenge = await Challenge.findById(id);

    if (!challenge) {
      return next(new ApiError(404, "Challenge not found"));
    }

    // Check if challenge is active
    if (challenge.isCompleted) {
      return next(new ApiError(400, "Challenge is already completed"));
    }

    // Check if user is already a participant
    const isParticipant = challenge.participants.some(
      (p) => p.walletAddress === user.walletAddress
    );

    if (isParticipant) {
      return next(new ApiError(400, "You are already a participant"));
    }

    // Check if challenge has reached max participants
    if (challenge.participantCount >= challenge.maxParticipants) {
      return next(new ApiError(400, "Challenge has reached max participants"));
    }

    // Add participant to challenge
    challenge.participants.push({
      walletAddress: user.walletAddress,
      did: user.privyId,
      stakeAmount: challenge.stakeAmount,
      completed: false,
      claimed: false,
      joinedAt: new Date(),
    });

    // Update challenge stats
    challenge.participantCount += 1;
    challenge.totalStake += challenge.stakeAmount;

    // Check if challenge becomes active
    if (challenge.participantCount >= challenge.minParticipants) {
      challenge.isActive = true;
    }

    await challenge.save();

    // Update user stats for joining challenge
    if (user._id) {
      // Initialize stats if they don't exist
      if (!user.stats) {
        user.stats = {
          totalStepCount: 0,
          challengesCompleted: 0,
          challengesJoined: 0,
          challengesCreated: 0,
          totalStaked: 0,
          totalEarned: 0,
          winRate: 0,
          lastUpdated: new Date(),
        };
      }

      // Update stats
      user.stats.challengesJoined = (user.stats.challengesJoined || 0) + 1;
      user.stats.totalStaked =
        (user.stats.totalStaked || 0) + challenge.stakeAmount;
      user.stats.lastUpdated = new Date();

      await user.save();
    }

    return res
      .status(200)
      .json(new ApiResponse(200, challenge, "Challenge joined successfully"));
  } catch (error) {
    console.error("Error joining challenge:", error);
    return next(new ApiError(500, "Failed to join challenge"));
  }
};

// Claim reward for a completed challenge
export const claimReward = async (
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
    const { transactionId } = req.body;

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

    // Verify challenge is completed
    if (!challenge.isCompleted) {
      return next(new ApiError(400, "Challenge is not completed yet"));
    }

    // Verify challenge has been verified on-chain
    if (!challenge.onChainVerificationComplete) {
      return next(
        new ApiError(
          400,
          "Challenge verification is still in progress. Please try again later."
        )
      );
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

    const participant = challenge.participants[participantIndex];

    // Check if participant is eligible for rewards
    if (!participant.completed) {
      return next(new ApiError(400, "You did not complete this challenge"));
    }

    // Check if rewards have already been claimed
    if (participant.claimed) {
      return next(
        new ApiError(400, "You have already claimed rewards for this challenge")
      );
    }

    // Mark as claimed if transaction ID is provided
    if (transactionId) {
      challenge.participants[participantIndex].claimed = true;
      await challenge.save();
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          challengeId: challenge.id,
          isCompleted: participant.completed,
          isClaimed: participant.claimed,
          transactionId: transactionId || null,
        },
        "Reward claim processed successfully"
      )
    );
  } catch (error) {
    console.error("Error claiming reward:", error);
    return next(new ApiError(500, "Failed to claim reward"));
  }
};
