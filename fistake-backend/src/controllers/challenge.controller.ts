import { Request, Response } from "express";
import Challenge from "../models/challenge.model";

export const getChallenges = async (req: Request, res: Response) => {
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

    res.status(200).json({
      success: true,
      data: challenges,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching challenges:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch challenges",
    });
  }
};

export const getChallengeById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const challenge = await Challenge.findById(id);

    if (!challenge) {
      return res.status(404).json({
        success: false,
        error: "Challenge not found",
      });
    }

    res.status(200).json({
      success: true,
      data: challenge,
    });
  } catch (error) {
    console.error("Error fetching challenge:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch challenge",
    });
  }
};

export const getUserChallenges = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const { did } = req.user;
    const { status, limit = 10, page = 1 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

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

    res.status(200).json({
      success: true,
      data: challenges,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching user challenges:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch user challenges",
    });
  }
};

export const createChallenge = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const { did } = req.user;
    const challengeData = {
      ...req.body,
      createdBy: did,
      participants: [
        {
          did,
          status: "ACTIVE",
          joinedAt: new Date(),
        },
      ],
    };

    const challenge = new Challenge(challengeData);
    await challenge.save();

    res.status(201).json({
      success: true,
      data: challenge,
    });
  } catch (error) {
    console.error("Error creating challenge:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create challenge",
    });
  }
};

export const joinChallenge = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const { did } = req.user;
    const { id } = req.params;

    const challenge = await Challenge.findById(id);

    if (!challenge) {
      return res.status(404).json({
        success: false,
        error: "Challenge not found",
      });
    }

    // Check if the user is already a participant
    const isParticipant = challenge.participants.some(
      (participant) => participant.did === did
    );

    if (isParticipant) {
      return res.status(400).json({
        success: false,
        error: "You have already joined this challenge",
      });
    }

    // Add the user as a participant
    challenge.participants.push({
      did,
      status: "ACTIVE",
      joinedAt: new Date(),
    });

    // Update the pool amount
    challenge.poolAmount += challenge.stake.amount;

    await challenge.save();

    res.status(200).json({
      success: true,
      data: challenge,
    });
  } catch (error) {
    console.error("Error joining challenge:", error);
    res.status(500).json({
      success: false,
      error: "Failed to join challenge",
    });
  }
};

export const updateChallengeStatus = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const { did } = req.user;
    const { id } = req.params;
    const { status } = req.body;

    if (!["ACTIVE", "COMPLETED", "FAILED"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status",
      });
    }

    const challenge = await Challenge.findById(id);

    if (!challenge) {
      return res.status(404).json({
        success: false,
        error: "Challenge not found",
      });
    }

    // Find the user's participation record
    const participantIndex = challenge.participants.findIndex(
      (participant) => participant.did === did
    );

    if (participantIndex === -1) {
      return res.status(400).json({
        success: false,
        error: "You are not a participant in this challenge",
      });
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

    res.status(200).json({
      success: true,
      data: challenge,
    });
  } catch (error) {
    console.error("Error updating challenge status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update challenge status",
    });
  }
};
