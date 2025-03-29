import * as anchor from "@project-serum/anchor";
import { Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";
import fs from "fs";
import cron from "node-cron";
import path from "path";
import Challenge from "../models/challenge.model";
import UserModel from "../models/user.model";
import badgeService from "./badge.service";

// Load IDL
let idl: any;
try {
  const idlFile = path.resolve(__dirname, "../idl/accountability.json");
  idl = JSON.parse(fs.readFileSync(idlFile, "utf-8"));
} catch (error) {
  console.error("Error loading IDL:", error);
  console.error("Contract verification will not work!");
  idl = null;
}

// Connection to Solana devnet
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

// Program ID from IDL metadata
const PROGRAM_ID = idl ? new PublicKey(idl.metadata.address) : null;

// Load keypair for admin operations
let adminKeypair: Keypair;
try {
  const keypairFile = path.resolve(__dirname, "../config/keypair.json");
  const keypairData = JSON.parse(fs.readFileSync(keypairFile, "utf-8"));
  adminKeypair = Keypair.fromSecretKey(new Uint8Array(keypairData));
} catch (error) {
  console.error("Error loading admin keypair:", error);
  // Fallback to a new keypair for development only
  adminKeypair = Keypair.generate();
  console.warn("Using generated keypair - DO NOT USE IN PRODUCTION!");
}

// Initialize cron jobs
export const initCronJobs = () => {
  if (!PROGRAM_ID) {
    console.error(
      "Program ID not available, cron jobs may not function correctly"
    );
  }

  // Check for ended challenges every 30 seconds
  cron.schedule("*/30 * * * * *", processEndedChallenges);

  // Initialize badges
  badgeService.initializeBadges();
};

/**
 * Find CompletedList PDA for a challenge
 */
const findCompletedListPDA = (challengePda: PublicKey): [PublicKey, number] => {
  if (!PROGRAM_ID) {
    throw new Error("Program ID not available");
  }
  return PublicKey.findProgramAddressSync(
    [Buffer.from("completed_list"), challengePda.toBuffer()],
    PROGRAM_ID
  );
};

/**
 * Process ended challenges - mark as completed and verify participants
 */
const processEndedChallenges = async () => {
  try {
    const currentTime = Math.floor(Date.now() / 1000); // Current timestamp in seconds

    // Find challenges that have ended but not marked completed
    const challenges = await Challenge.find({
      endTime: { $lt: currentTime },
      isCompleted: false,
    });

    if (challenges.length === 0) return;

    for (const challenge of challenges) {
      const { goal } = challenge;
      const completedWallets: string[] = [];

      // Process each participant
      for (const participant of challenge.participants) {
        // Skip if already completed
        if (participant.completed) {
          completedWallets.push(participant.walletAddress);
          continue;
        }

        // Verify health data and update completion status
        if (participant.healthData && participant.healthData.length > 0) {
          const totalSteps = participant.healthData.reduce(
            (sum: number, data: any) => sum + data.steps,
            0
          );

          if (totalSteps >= goal.value) {
            participant.completed = true;
            completedWallets.push(participant.walletAddress);

            // Update user stats if DID exists
            if (participant.did) {
              const user = await UserModel.findOne({
                privyId: participant.did,
              });
              if (user) {
                // Initialize stats if needed
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
                user.stats.totalStepCount =
                  (user.stats.totalStepCount || 0) + totalSteps;
                user.stats.challengesCompleted =
                  (user.stats.challengesCompleted || 0) + 1;
                user.stats.totalEarned =
                  (user.stats.totalEarned || 0) + challenge.stakeAmount;
                user.stats.lastUpdated = new Date();

                // Calculate win rate
                if (user.stats.challengesJoined > 0) {
                  user.stats.winRate =
                    user.stats.challengesCompleted /
                    user.stats.challengesJoined;
                }

                await user.save();

                // Check for badge awards
                if (user._id) {
                  const newBadges = await badgeService.checkAndAwardBadges(
                    user._id.toString()
                  );
                }
              }
            }
          }
        }
      }

      // Mark challenge as completed
      challenge.isCompleted = true;
      await challenge.save();

      // Submit to chain if there are completed wallets
      if (completedWallets.length > 0) {
        const submitted = await submitCompletedWalletsToContract(
          challenge,
          completedWallets
        );

        if (submitted) {
          // Update verification status
          challenge.onChainVerificationComplete = true;
          await challenge.save();
        }
      } else {
        // Mark as verified when no completions
        challenge.onChainVerificationComplete = true;
        await challenge.save();
      }
    }
  } catch (error) {
    console.error("Error processing ended challenges:", error);
  }
};

/**
 * Submit completed wallets to the Solana contract
 */
const submitCompletedWalletsToContract = async (
  challenge: any,
  completedWallets: string[]
): Promise<boolean> => {
  try {
    if (!idl || !PROGRAM_ID) {
      console.error("IDL or Program ID not available");
      return false;
    }

    // Process wallets in batches (Solana has transaction size limits)
    const BATCH_SIZE = 20;
    const walletBatches = [];

    for (let i = 0; i < completedWallets.length; i += BATCH_SIZE) {
      walletBatches.push(completedWallets.slice(i, i + BATCH_SIZE));
    }

    // Initialize Anchor program
    const provider = new anchor.AnchorProvider(
      connection,
      new anchor.Wallet(adminKeypair),
      { commitment: "confirmed" }
    );

    const program = new anchor.Program(idl, PROGRAM_ID, provider);

    // Get challenge PDA
    const challengePDA = new PublicKey(challenge.solanaChallengePda);

    // Process each batch
    for (let batchIndex = 0; batchIndex < walletBatches.length; batchIndex++) {
      const batch = walletBatches[batchIndex];

      // Convert wallet addresses to PublicKeys
      const batchPublicKeys = batch.map((wallet) => new PublicKey(wallet));

      try {
        // Get completedList PDA
        const [completedListPDA] = findCompletedListPDA(challengePDA);

        // Submit completions
        const adminCompleteTx = await program.methods
          .adminCompleteChallenges(batchPublicKeys)
          .accounts({
            challenge: challengePDA,
            completedList: completedListPDA,
            admin: adminKeypair.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([adminKeypair])
          .rpc();

        // Wait for confirmation
        await connection.confirmTransaction(adminCompleteTx, "confirmed");
      } catch (error) {
        console.error(`Error processing batch ${batchIndex + 1}:`, error);
        // Continue with next batch
      }
    }

    // Finalize the challenge
    try {
      const finalizeTx = await program.methods
        .finalizeChallenge()
        .accounts({
          challenge: challengePDA,
          admin: adminKeypair.publicKey,
        })
        .signers([adminKeypair])
        .rpc();

      await connection.confirmTransaction(finalizeTx, "confirmed");

      return true;
    } catch (error) {
      console.error("Error finalizing challenge:", error);
      return false;
    }
  } catch (error) {
    console.error("Error submitting to contract:", error);
    return false;
  }
};

export default {
  initCronJobs,
};
