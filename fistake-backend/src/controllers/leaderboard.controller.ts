import { NextFunction, Request, Response } from "express";
import UserModel from "../models/user.model";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";

/**
 * Get All-Time Leaderboard
 * Returns paginated leaderboard data sorted by various metrics
 */
export const getAllTimeLeaderboard = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      limit = 10,
      page = 1,
      sortBy = "stats.totalStepCount",
      sortOrder = "desc",
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const sortDirection = sortOrder === "asc" ? 1 : -1;

    // Validate sort field
    const validSortFields = [
      "stats.totalStepCount",
      "stats.challengesCompleted",
      "stats.challengesJoined",
      "stats.challengesCreated",
      "stats.totalStaked",
      "stats.totalEarned",
      "stats.winRate",
    ];

    if (!validSortFields.includes(sortBy as string)) {
      return next(new ApiError(400, "Invalid sort field"));
    }

    // Build sort options
    const sortOptions: any = {};
    sortOptions[sortBy as string] = sortDirection;

    // Fetch users with stats
    const users = await UserModel.find(
      { "stats.lastUpdated": { $exists: true } },
      {
        username: 1,
        walletAddress: 1,
        stats: 1,
        badges: 1,
      }
    )
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit));

    // Count total documents that match the query
    const total = await UserModel.countDocuments({
      "stats.lastUpdated": { $exists: true },
    });

    // Transform data for response
    const leaderboardEntries = users.map((user) => ({
      username: user.username,
      walletAddress: user.walletAddress,
      stats: user.stats || {
        totalStepCount: 0,
        challengesCompleted: 0,
        challengesJoined: 0,
        challengesCreated: 0,
        totalStaked: 0,
        totalEarned: 0,
        winRate: 0,
      },
      badgeCount: user.badges?.length || 0,
    }));

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          leaderboard: leaderboardEntries,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / Number(limit)),
          },
        },
        "Leaderboard retrieved successfully"
      )
    );
  } catch (error) {
    console.error("Error retrieving leaderboard:", error);
    return next(new ApiError(500, "Failed to retrieve leaderboard"));
  }
};
