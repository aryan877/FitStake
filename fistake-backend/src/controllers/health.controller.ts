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
  console.log("submitHealthData: Starting health data submission");
  try {
    if (!req.user) {
      console.log("submitHealthData: No user in request");
      return next(new ApiError(401, "Authentication required"));
    }

    const { did } = req.user;
    const { id } = req.params;
    const { healthData } = req.body;

    console.log("submitHealthData: Request body:", req.body);

    console.log(
      `submitHealthData: Processing request for user DID: ${did}, challenge ID: ${id}`
    );
    console.log(
      `submitHealthData: Received ${
        healthData?.length || 0
      } health data records`
    );

    // Verify user has wallet address
    const user = await UserModel.findOne({ privyId: did });
    if (!user || !user.walletAddress) {
      console.log(
        `submitHealthData: User not found or wallet not connected. User: ${!!user}`
      );
      return next(
        new ApiError(
          400,
          "Wallet address not set. Please connect your wallet first."
        )
      );
    }
    console.log(
      `submitHealthData: Found user with wallet: ${user.walletAddress}`
    );

    // Find the challenge
    const challenge = await Challenge.findById(id);

    if (!challenge) {
      console.log(`submitHealthData: Challenge not found with ID: ${id}`);
      return next(new ApiError(404, "Challenge not found"));
    }
    console.log(
      `submitHealthData: Found challenge: ${challenge.title}, goal: ${challenge.goal.value}`
    );

    // Check if challenge is already completed
    if (challenge.isCompleted) {
      console.log(`submitHealthData: Challenge already completed`);
      return next(
        new ApiError(
          400,
          "This challenge has already ended and cannot accept new data."
        )
      );
    }

    // Find the user's participant record
    const participantIndex = challenge.participants.findIndex(
      (p) => p.walletAddress === user.walletAddress
    );

    if (participantIndex === -1) {
      console.log(`submitHealthData: User not a participant in this challenge`);
      return next(
        new ApiError(400, "You are not a participant in this challenge")
      );
    }
    console.log(
      `submitHealthData: Found participant at index: ${participantIndex}`
    );

    // Basic validation
    if (!Array.isArray(healthData) || healthData.length === 0) {
      console.log(
        `submitHealthData: Invalid health data format: ${typeof healthData}`
      );
      return next(
        new ApiError(400, "Invalid health data format or empty data array")
      );
    }

    console.log("submitHealthData: Processing and verifying health data");

    // Verification metrics
    let totalVerifiedRecords = 0;
    let totalSuspiciousRecords = 0;

    let anomalies: AnomalyData[] = [];

    // Process health data with enhanced verification checks
    const processedData = healthData.map((item: any) => {
      // Extract data
      const date = item.date;
      const steps = Number(item.count) || 0;
      console.log(
        `submitHealthData: Processing data for ${date}, steps: ${steps}`
      );

      // Basic verification checks
      const hasSources = Array.isArray(item.sources) && item.sources.length > 0;
      console.log(
        `submitHealthData: [${date}] Has sources: ${hasSources}, sources: ${JSON.stringify(
          item.sources || []
        )}`
      );

      const hasRecordCount = Number(item.recordCount) > 0;
      console.log(
        `submitHealthData: [${date}] Has record count: ${hasRecordCount}, count: ${item.recordCount}`
      );

      const hasReasonableStepCount = steps >= 0 && steps <= 100000; // Sanity check for step count
      console.log(
        `submitHealthData: [${date}] Has reasonable step count: ${hasReasonableStepCount}, steps: ${steps}`
      );

      // check if individual records are provided
      const hasDetailedRecords =
        Array.isArray(item.records) && item.records.length > 0;
      console.log(
        `submitHealthData: [${date}] Has detailed records: ${hasDetailedRecords}, records count: ${
          item.records?.length || 0
        }`
      );

      // Enhanced anti-fraud checks using detailed records
      let isSuspicious = false;
      let anomalyDetails = [];

      if (hasDetailedRecords) {
        console.log(
          `submitHealthData: [${date}] Detailed records found: ${item.records.length}`
        );
        // Check if aggregated count matches sum of individual records
        const sumOfIndividualCounts = item.records.reduce(
          (sum: number, record: any) => {
            const recordCount = record.count || 0;
            console.log(
              `submitHealthData: [${date}] Record count: ${recordCount}, running sum: ${sum} -> ${
                sum + recordCount
              }`
            );
            return sum + recordCount;
          },
          0
        );
        console.log(
          `submitHealthData: [${date}] Sum of individual records: ${sumOfIndividualCounts}, reported total: ${steps}`
        );

        // Allow for small discrepancies due to aggregation methods
        const countMatchesRecords =
          Math.abs(steps - sumOfIndividualCounts) <= 5;
        console.log(
          `submitHealthData: [${date}] Count matches records: ${countMatchesRecords}, difference: ${Math.abs(
            steps - sumOfIndividualCounts
          )}`
        );

        if (!countMatchesRecords && steps > sumOfIndividualCounts + 50) {
          isSuspicious = true;
          const anomalyMsg = `Aggregated count (${steps}) much higher than sum of records (${sumOfIndividualCounts})`;
          console.log(`submitHealthData: [${date}] ANOMALY - ${anomalyMsg}`);
          anomalyDetails.push(anomalyMsg);
        }

        // Check if all records have reasonable timestamps
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        console.log(
          `submitHealthData: [${date}] Valid time range: ${startDate.toISOString()} to ${endDate.toISOString()}`
        );

        // Look for records with unusual timestamps
        const recordsWithInvalidTimes = item.records.filter((record: any) => {
          const startTime = new Date(record.startTime);
          const endTime = new Date(record.endTime);
          console.log(
            `submitHealthData: [${date}] Checking record time: ${startTime.toISOString()} to ${endTime.toISOString()}`
          );

          // Check if record is within day's bounds
          const isWithinDay = startTime >= startDate && endTime <= endDate;
          console.log(
            `submitHealthData: [${date}] Record is within day bounds: ${isWithinDay}`
          );

          // Check if record has sensible duration (like not spanning many hours)
          const durationMs = endTime.getTime() - startTime.getTime();
          const durationIsReasonable = durationMs > 0 && durationMs < 3600000; // Less than 1 hour
          console.log(
            `submitHealthData: [${date}] Record has reasonable duration: ${durationIsReasonable}, duration: ${durationMs}ms (${
              durationMs / 1000 / 60
            } minutes)`
          );

          return !isWithinDay || !durationIsReasonable;
        });

        if (recordsWithInvalidTimes.length > 0) {
          isSuspicious = true;
          const anomalyMsg = `${recordsWithInvalidTimes.length} records have suspicious timestamps`;
          console.log(`submitHealthData: [${date}] ANOMALY - ${anomalyMsg}`);
          anomalyDetails.push(anomalyMsg);
        }

        // Check if data comes from known fitness apps
        const hasKnownSources = item.sources.some((source: string) => {
          const isKnown =
            source.includes("fitbit") ||
            source.includes("google.android.apps.fitness") ||
            source.includes("samsung.health") ||
            source.includes("mi.health") ||
            source.includes("huawei.health");
          console.log(
            `submitHealthData: [${date}] Checking source: ${source}, is known: ${isKnown}`
          );
          return isKnown;
        });

        if (!hasKnownSources) {
          isSuspicious = true;
          const anomalyMsg = `Unknown data sources: ${item.sources.join(", ")}`;
          console.log(`submitHealthData: [${date}] ANOMALY - ${anomalyMsg}`);
          anomalyDetails.push(anomalyMsg);
        }
      }

      // Track verification status
      const isVerified =
        hasSources &&
        hasRecordCount &&
        hasReasonableStepCount &&
        hasDetailedRecords &&
        !isSuspicious;

      if (isVerified) {
        totalVerifiedRecords++;
        console.log(`submitHealthData: [${date}] Data VERIFIED`);
      } else if (steps > 0) {
        totalSuspiciousRecords++;
        console.log(
          `submitHealthData: [${date}] Data SUSPICIOUS - hasSources: ${hasSources}, hasRecordCount: ${hasRecordCount}, hasReasonableStepCount: ${hasReasonableStepCount}, hasDetailedRecords: ${hasDetailedRecords}, isSuspicious: ${isSuspicious}`
        );
        if (anomalyDetails.length > 0) {
          anomalies.push({
            date,
            steps,
            anomalies: anomalyDetails,
          });
        }
      }

      // Log suspicious data
      if (steps > 50000) {
        console.warn(
          `submitHealthData: [${date}] High step count detected: ${steps} steps`
        );
      }

      // Save the original COUNT_TOTAL value (with sanity check)
      // We'll only reject steps that are clearly invalid
      const finalStepCount =
        hasReasonableStepCount && !isSuspicious ? steps : 0;
      console.log(
        `submitHealthData: [${date}] Final step count: ${finalStepCount} (original: ${steps})`
      );

      return {
        date,
        steps: finalStepCount,
        lastUpdated: new Date(),
      };
    });

    console.log(
      `submitHealthData: Verification summary: ${totalVerifiedRecords} verified records, ${totalSuspiciousRecords} suspicious records out of ${healthData.length} total`
    );

    if (anomalies.length > 0) {
      console.log(
        `submitHealthData: Anomaly details: ${JSON.stringify(
          anomalies,
          null,
          2
        )}`
      );
    }

    // Update participant's health data (save only essential data)
    challenge.participants[participantIndex].healthData = processedData;
    console.log(
      `submitHealthData: Updated participant health data with ${processedData.length} records`
    );

    // Calculate total steps and progress
    let totalSteps = 0;
    processedData.forEach((data) => {
      console.log(
        `submitHealthData: Adding ${data.steps} steps from ${data.date} to total`
      );
      totalSteps += data.steps;
    });
    console.log(
      `submitHealthData: Total steps calculated: ${totalSteps}, goal: ${challenge.goal.value}`
    );

    // Calculate progress as a ratio (0-1)
    const progressRatio = totalSteps / challenge.goal.value;
    console.log(
      `submitHealthData: Progress ratio calculation: ${totalSteps} / ${challenge.goal.value} = ${progressRatio}`
    );

    const progress = Math.min(1, progressRatio);
    console.log(
      `submitHealthData: Final progress (capped at 1): ${progress} (${
        progress * 100
      }%)`
    );

    challenge.participants[participantIndex].progress = progress;

    // Mark as completed if goal reached
    const isCompleted = totalSteps >= challenge.goal.value;
    console.log(
      `submitHealthData: Challenge completion check: ${totalSteps} >= ${challenge.goal.value} = ${isCompleted}`
    );

    if (isCompleted) {
      console.log(
        `submitHealthData: User ${user.walletAddress} completed the challenge with ${totalSteps}/${challenge.goal.value} steps`
      );
      challenge.participants[participantIndex].completed = true;
    }

    console.log(`submitHealthData: Saving challenge updates to database`);
    await challenge.save();
    console.log(`submitHealthData: Challenge saved successfully`);

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

    // Transform the backend healthData format (steps) to frontend format (count) if needed
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
