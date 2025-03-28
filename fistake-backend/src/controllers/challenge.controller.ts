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

    console.log("Search params:", req.query);
    const skip = (Number(page) - 1) * Number(limit);

    // Determine sort direction
    const sortDirection = sortOrder === "asc" ? 1 : -1;
    const sortOptions: any = {};
    sortOptions[sortBy as string] = sortDirection;

    // Build query based on filters
    let query: any = {};

    // Filter by visibility (public/private challenges)
    if (visibility === "public") {
      query.isPublic = true;
    } else if (visibility === "private") {
      query.isPublic = false;
    } else if (visibility === "all") {
      // Explicitly don't add any visibility filter
      console.log("Searching across both public and private challenges");
    }
    // If visibility is not specified, don't add filter for isPublic

    // Search text in title, description, and challengeId
    if (searchText) {
      const trimmedSearchText = String(searchText).trim();

      // Only proceed with search if we have actual text after trimming
      if (trimmedSearchText.length > 0) {
        console.log(`Searching with text: "${trimmedSearchText}"`);

        // First, try to find an exact match for challengeId
        const exactMatch = await Challenge.findOne({
          challengeId: trimmedSearchText,
        });

        if (exactMatch) {
          // If exact match is found, override all other filters to return just this challenge
          console.log(
            `Found exact match for challengeId: ${trimmedSearchText}`
          );

          // Override the query to only search by this challengeId
          // This ensures the challenge is found regardless of visibility settings
          query = { challengeId: trimmedSearchText };

          console.log(
            `Found challenge: ${exactMatch.title} (${
              exactMatch.isPublic ? "public" : "private"
            })`
          );
        } else {
          // No exact match by challengeId, try pattern matching
          console.log(`No exact challengeId match for: "${trimmedSearchText}"`);

          const searchRegex = new RegExp(trimmedSearchText, "i");

          // Use regex to search across multiple fields
          query.$or = [
            { challengeId: { $regex: searchRegex } },
            { title: { $regex: searchRegex } },
            { description: { $regex: searchRegex } },
          ];

          // For multi-word searches, also try text search
          if (
            trimmedSearchText.includes(" ") &&
            trimmedSearchText.length >= 3
          ) {
            console.log("Also using text search for multi-word query");
            // We use $or to combine with the existing query
            if (!query.$or) {
              query.$or = [];
            }

            // Add text search as another condition
            query.$or.push({ $text: { $search: trimmedSearchText } });

            // Add relevance score for sorting
            sortOptions.score = { $meta: "textScore" };
          }
        }
      }
    }

    console.log("Final query:", JSON.stringify(query, null, 2));
    console.log("Sort options:", JSON.stringify(sortOptions, null, 2));

    if (type) {
      query.type = type;
    }

    // Status filter
    if (status === "active") {
      query.isCompleted = false;
    } else if (status === "completed") {
      query.isCompleted = true;
    }

    // Stake amount range filter
    if (minStake || maxStake) {
      query.stakeAmount = {};
      if (minStake) {
        // Convert from SOL to lamports (1 SOL = 1,000,000,000 lamports)
        const minStakeLamports = Number(minStake) * LAMPORTS_PER_SOL;
        query.stakeAmount.$gte = minStakeLamports;
        console.log(
          `Converting minStake from ${minStake} SOL to ${minStakeLamports} lamports`
        );
      }
      if (maxStake) {
        // Convert from SOL to lamports (1 SOL = 1,000,000,000 lamports)
        const maxStakeLamports = Number(maxStake) * LAMPORTS_PER_SOL;
        query.stakeAmount.$lte = maxStakeLamports;
        console.log(
          `Converting maxStake from ${maxStake} SOL to ${maxStakeLamports} lamports`
        );
      }
    }

    // Goal range filter
    if (minGoal || maxGoal) {
      query["goal.value"] = {};
      if (minGoal) {
        query["goal.value"].$gte = Number(minGoal);
      }
      if (maxGoal) {
        query["goal.value"].$lte = Number(maxGoal);
      }
    }

    // Participant count filter
    if (minParticipants || maxParticipants) {
      query.participantCount = {};
      if (minParticipants) {
        query.participantCount.$gte = Number(minParticipants);
      }
      if (maxParticipants) {
        query.participantCount.$lte = Number(maxParticipants);
      }
    }

    // Fetch challenges
    const challenges = await Challenge.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit));

    // Get total count for pagination
    const total = await Challenge.countDocuments(query);

    console.log(
      `Query returned ${challenges.length} results out of ${total} total matches`
    );

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

      if (newBadges.length > 0) {
        console.log(
          `User ${user.username} awarded ${
            newBadges.length
          } new badges for creating challenge: ${newBadges.join(", ")}`
        );
        console.log(
          `Badge count: before=${badgeCountBefore}, after=${
            user.badges?.length || 0
          }`
        );
      }
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

      // Check badge count before
      const badgeCountBefore = user.badges?.length || 0;

      // Check for new badges
      const newBadges = await badgeService.checkAndAwardBadges(
        user._id.toString()
      );

      if (newBadges.length > 0) {
        console.log(
          `User ${user.username} awarded ${
            newBadges.length
          } new badges for joining challenge: ${newBadges.join(", ")}`
        );
        console.log(
          `Badge count: before=${badgeCountBefore}, after=${
            user.badges?.length || 0
          }`
        );
      }
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
