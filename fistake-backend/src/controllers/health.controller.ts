import { NextFunction, Request, Response } from "express";
import Challenge from "../models/challenge.model";
import UserModel from "../models/user.model";
import { AnomalyData, BackendHealthData, FrontendHealthData } from "../types";
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
    if (!req.user) return next(new ApiError(401, "Authentication required"));

    const { did } = req.user;
    const { id } = req.params;
    const { healthData } = req.body;

    // Verify user and wallet
    const user = await UserModel.findOne({ privyId: did });
    if (!user || !user.walletAddress) {
      return next(
        new ApiError(
          400,
          "Wallet address not set. Please connect your wallet first."
        )
      );
    }

    // Find challenge
    const challenge = await Challenge.findById(id);
    if (!challenge) return next(new ApiError(404, "Challenge not found"));

    // Check challenge status
    if (challenge.isCompleted) {
      return next(
        new ApiError(
          400,
          "This challenge has already ended and cannot accept new data."
        )
      );
    }

    // Verify user participation
    const participantIndex = challenge.participants.findIndex(
      (p) => p.walletAddress === user.walletAddress
    );
    if (participantIndex === -1) {
      return next(
        new ApiError(400, "You are not a participant in this challenge")
      );
    }

    // Validate health data
    if (!Array.isArray(healthData) || healthData.length === 0) {
      return next(
        new ApiError(400, "Invalid health data format or empty data array")
      );
    }

    // Verification metrics
    let totalVerifiedRecords = 0;
    let totalSuspiciousRecords = 0;
    let anomalies: AnomalyData[] = [];

    // Process health data with verification
    const processedData = healthData.map((item: any) => {
      const date = item.date;
      const steps = Number(item.count) || 0;

      // Basic verification checks
      const hasSources = Array.isArray(item.sources) && item.sources.length > 0;
      const hasRecordCount = Number(item.recordCount) > 0;
      const hasReasonableStepCount = steps >= 0 && steps <= 100000;
      const hasDetailedRecords =
        Array.isArray(item.records) && item.records.length > 0;

      // Check for suspicious data
      let isSuspicious = false;
      let anomalyDetails = [];

      if (hasDetailedRecords) {
        // Verify aggregated count matches sum of records
        const sumOfIndividualCounts = item.records.reduce(
          (sum: number, record: any) => sum + (record.count || 0),
          0
        );

        const countMatchesRecords =
          Math.abs(steps - sumOfIndividualCounts) <= 5;
        if (!countMatchesRecords && steps > sumOfIndividualCounts + 50) {
          isSuspicious = true;
          anomalyDetails.push(
            `Aggregated count (${steps}) much higher than sum of records (${sumOfIndividualCounts})`
          );
        }

        // Check record timestamps
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);

        const recordsWithInvalidTimes = item.records.filter((record: any) => {
          const startTime = new Date(record.startTime);
          const endTime = new Date(record.endTime);
          const isWithinDay = startTime >= startDate && endTime <= endDate;
          const durationMs = endTime.getTime() - startTime.getTime();
          const durationIsReasonable = durationMs > 0 && durationMs < 3600000; // < 1 hour
          return !isWithinDay || !durationIsReasonable;
        });

        if (recordsWithInvalidTimes.length > 0) {
          isSuspicious = true;
          anomalyDetails.push(
            `${recordsWithInvalidTimes.length} records have suspicious timestamps`
          );
        }

        // Check data sources
        const hasKnownSources = item.sources.some(
          (source: string) =>
            source.includes("fitbit") ||
            source.includes("google.android.apps.fitness") ||
            source.includes("samsung.health") ||
            source.includes("mi.health") ||
            source.includes("huawei.health")
        );

        if (!hasKnownSources) {
          isSuspicious = true;
          anomalyDetails.push(
            `Unknown data sources: ${item.sources.join(", ")}`
          );
        }
      }

      // Determine if record is verified
      const isVerified =
        hasSources &&
        hasRecordCount &&
        hasReasonableStepCount &&
        hasDetailedRecords &&
        !isSuspicious;

      if (isVerified) totalVerifiedRecords++;
      else if (steps > 0) {
        totalSuspiciousRecords++;
        if (anomalyDetails.length > 0) {
          anomalies.push({ date, steps, anomalies: anomalyDetails });
        }
      }

      // Final step count - only count valid steps
      const finalStepCount =
        hasReasonableStepCount && !isSuspicious ? steps : 0;

      return {
        date,
        steps: finalStepCount,
        lastUpdated: new Date(),
      };
    });

    // Update participant data
    challenge.participants[participantIndex].healthData = processedData;

    // Calculate progress
    let totalSteps = 0;
    processedData.forEach((data) => {
      totalSteps += data.steps;
    });

    const progressRatio = totalSteps / challenge.goal.value;
    const progress = Math.min(1, progressRatio);
    challenge.participants[participantIndex].progress = progress;

    // Check completion
    const isCompleted = totalSteps >= challenge.goal.value;
    if (isCompleted) {
      challenge.participants[participantIndex].completed = true;
    }

    await challenge.save();

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          progress,
          totalSteps,
          goalSteps: challenge.goal.value,
          isCompleted: challenge.participants[participantIndex].completed,
        },
        "Health data submitted successfully"
      )
    );
  } catch (error) {
    console.error("submitHealthData ERROR:", error);
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
    if (!req.user) return next(new ApiError(401, "Authentication required"));

    const { did } = req.user;
    const { id } = req.params;

    // Verify user
    const user = await UserModel.findOne({ privyId: did });
    if (!user || !user.walletAddress) {
      return next(
        new ApiError(
          400,
          "Wallet address not set. Please connect your wallet first."
        )
      );
    }

    // Find challenge
    const challenge = await Challenge.findById(id);
    if (!challenge) return next(new ApiError(404, "Challenge not found"));

    // Find participant
    const participant = challenge.participants.find(
      (p) => p.walletAddress === user.walletAddress
    );
    if (!participant) {
      return next(
        new ApiError(400, "You are not a participant in this challenge")
      );
    }

    // Convert backend to frontend format
    const transformedHealthData = participant.healthData
      ? participant.healthData.map(
          (item: BackendHealthData): FrontendHealthData => ({
            date: item.date,
            count: item.steps,
          })
        )
      : [];

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          progress: participant.progress || 0,
          completed: participant.completed,
          claimed: participant.claimed,
          healthData: transformedHealthData,
        },
        "Challenge progress retrieved successfully"
      )
    );
  } catch (error) {
    console.error("Error getting challenge progress:", error);
    return next(new ApiError(500, "Failed to get challenge progress"));
  }
};
