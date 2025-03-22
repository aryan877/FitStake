import * as anchor from "@project-serum/anchor";
import { Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";
import fs from "fs";
import cron from "node-cron";
import path from "path";
import Challenge from "../models/challenge.model";
import UserModel from "../models/user.model";
import badgeService from "./badge.service";

// Connection to Solana devnet
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

// Program ID for the Accountability program
const PROGRAM_ID = new PublicKey(
  "5hTA47XZPkJK7d6JrCEcmUaDbt6bgxNjgUDbRBo593er"
);

// Load keypair for admin operations
let adminKeypair: Keypair;
try {
  // First try to load from config directory
  const keypairFile = path.resolve(__dirname, "../config/keypair.json");
  const keypairData = JSON.parse(fs.readFileSync(keypairFile, "utf-8"));
  adminKeypair = Keypair.fromSecretKey(new Uint8Array(keypairData));
  console.log(
    `Admin pubkey loaded from config: ${adminKeypair.publicKey.toString()}`
  );
} catch (error) {
  console.log("Keypair not found in config, trying contract directory...");
  try {
    // Fall back to the contracts directory
    const keypairFile = path.resolve(
      __dirname,
      "../../../fitstake-contracts/keypair.json"
    );
    const keypairData = JSON.parse(fs.readFileSync(keypairFile, "utf-8"));
    adminKeypair = Keypair.fromSecretKey(new Uint8Array(keypairData));
    console.log(
      `Admin pubkey loaded from contracts: ${adminKeypair.publicKey.toString()}`
    );
  } catch (error) {
    console.error("Error loading admin keypair from both locations:", error);
    // Fallback to a new keypair if needed, but this should be avoided in production
    adminKeypair = Keypair.generate();
    console.warn(
      "Using generated keypair - this should only be used for development!"
    );
  }
}

// Load IDL
let idl: any;
try {
  // First try to load from local directory
  const idlFile = path.resolve(__dirname, "../idl/accountability.json");
  idl = JSON.parse(fs.readFileSync(idlFile, "utf-8"));
  console.log("IDL loaded from backend");
} catch (error) {
  console.log("IDL not found in backend, trying contract directory...");
  try {
    // Fall back to the contracts directory
    const idlFile = path.resolve(
      __dirname,
      "../../../fitstake-contracts/target/idl/accountability.json"
    );
    idl = JSON.parse(fs.readFileSync(idlFile, "utf-8"));
    console.log("IDL loaded from contracts");
  } catch (error) {
    console.error("Error loading IDL from both locations:", error);
    console.error("Contract verification will not work!");
  }
}

// Initialize cron jobs
export const initCronJobs = () => {
  console.log("Initializing cron jobs...");

  // Check for ended challenges and process them (runs every 30 seconds)
  cron.schedule("*/30 * * * * *", processEndedChallenges);

  // Initialize badges
  badgeService.initializeBadges();

  console.log("Cron jobs initialized");
};

// Function to derive CompletedList PDA for the contract
const findCompletedListPDA = async (challengePda: PublicKey) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("completed_list"), challengePda.toBuffer()],
    PROGRAM_ID
  );
};

// Function to process ended challenges - mark as completed and verify participants
const processEndedChallenges = async () => {
  try {
    console.log("Running processEndedChallenges job...");

    const currentTime = Math.floor(Date.now() / 1000); // Current timestamp in seconds

    // Find challenges that have ended but are not marked as completed yet
    const challenges = await Challenge.find({
      endTime: { $lt: currentTime },
      isCompleted: false,
    });

    if (challenges.length === 0) {
      console.log("No ended challenges to process");
      return;
    }

    console.log(`Found ${challenges.length} ended challenges to process`);

    // Process each challenge
    for (const challenge of challenges) {
      console.log(`Processing ended challenge ${challenge._id}`);

      // Get the challenge goal
      const { goal } = challenge;

      // Array to store completed participants' wallet addresses
      const completedWallets: string[] = [];

      // Process each participant
      for (const participant of challenge.participants) {
        // Skip if already marked as completed
        if (participant.completed) {
          completedWallets.push(participant.walletAddress);
          continue;
        }

        // Verify health data
        if (participant.healthData && participant.healthData.length > 0) {
          const totalSteps = participant.healthData.reduce(
            (sum: number, data: any) => sum + data.steps,
            0
          );

          if (totalSteps >= goal.value) {
            participant.completed = true;
            completedWallets.push(participant.walletAddress);
            console.log(
              `Participant ${participant.walletAddress} completed the challenge with ${totalSteps} steps (goal: ${goal.value})`
            );

            // Update user stats for completion
            if (participant.did) {
              const user = await UserModel.findOne({
                privyId: participant.did,
              });
              if (user) {
                console.log(`Updating stats for user ${user.username}`);

                // Initialize stats if not exist
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
                const stepCount = totalSteps;
                user.stats.totalStepCount =
                  (user.stats.totalStepCount || 0) + stepCount;
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

                // Check for badges before update
                const badgeCountBefore = user.badges?.length || 0;

                // Check for new badges
                if (user._id) {
                  const newBadges = await badgeService.checkAndAwardBadges(
                    user._id.toString()
                  );

                  // Print detailed badge information
                  if (newBadges.length > 0) {
                    console.log(
                      `User ${user.username} awarded ${
                        newBadges.length
                      } new badges: ${newBadges.join(", ")}`
                    );
                    console.log(
                      `Badge count: before=${badgeCountBefore}, after=${
                        user.badges?.length || 0
                      }`
                    );
                  } else {
                    console.log(
                      `No new badges awarded to user ${user.username}`
                    );
                  }
                }

                console.log(`Stats updated for user ${user.username}`);
              } else {
                console.log(`User not found for DID ${participant.did}`);
              }
            } else {
              console.log(
                `No DID associated with wallet ${participant.walletAddress}`
              );
            }
          } else {
            console.log(
              `Participant ${participant.walletAddress} failed the challenge with ${totalSteps}/${goal.value} steps`
            );
          }
        } else {
          console.log(
            `Participant ${participant.walletAddress} has no health data`
          );
        }
      }

      // Mark challenge as completed
      challenge.isCompleted = true;

      // Update the challenge with completed participants
      await challenge.save();

      // Submit completed wallets to the contract if there are any
      if (completedWallets.length > 0) {
        const submitted = await submitCompletedWalletsToContract(
          challenge,
          completedWallets
        );
        if (submitted) {
          console.log(
            `Successfully submitted completed wallets to contract for challenge ${challenge._id}`
          );

          // Update the challenge to indicate on-chain verification is complete
          challenge.onChainVerificationComplete = true;
          await challenge.save();
        } else {
          console.log(
            `Failed to submit completed wallets to contract for challenge ${challenge._id}`
          );
        }
      } else {
        console.log("No completed wallets to submit for challenge");

        // Mark the challenge as verified even if there are no completed wallets
        challenge.onChainVerificationComplete = true;
        await challenge.save();
      }

      console.log(
        `Processed challenge ${challenge._id}, found ${completedWallets.length} successful completions out of ${challenge.participants.length} participants`
      );
    }
  } catch (error) {
    console.error("Error in processEndedChallenges job:", error);
  }
};

// Function to submit completed wallets to the Solana contract
const submitCompletedWalletsToContract = async (
  challenge: any,
  completedWallets: string[]
) => {
  try {
    console.log(
      `Submitting ${completedWallets.length} completed wallets to contract for challenge ${challenge.challengeId}`
    );

    // Check if IDL is available
    if (!idl) {
      console.error("IDL not loaded, cannot submit to contract");
      return false;
    }

    // Solana has a limit on the number of accounts that can be included in a transaction
    // We'll process completions in batches of 20 wallets at a time
    const BATCH_SIZE = 20;
    const walletBatches = [];

    // Split the wallets into batches
    for (let i = 0; i < completedWallets.length; i += BATCH_SIZE) {
      walletBatches.push(completedWallets.slice(i, i + BATCH_SIZE));
    }

    console.log(
      `Split ${completedWallets.length} wallets into ${walletBatches.length} batches`
    );

    // Initialize the anchor program
    const provider = new anchor.AnchorProvider(
      connection,
      new anchor.Wallet(adminKeypair),
      { commitment: "confirmed" }
    );

    const program = new anchor.Program(idl, PROGRAM_ID, provider);
    console.log("Initialized Anchor program");

    // Get challenge PDA from the stored string value
    const challengePDA = new PublicKey(challenge.solanaChallengePda);

    // Process each batch separately
    for (let batchIndex = 0; batchIndex < walletBatches.length; batchIndex++) {
      const batch = walletBatches[batchIndex];
      console.log(
        `Processing batch ${batchIndex + 1}/${walletBatches.length} with ${
          batch.length
        } wallets`
      );

      // Convert wallet addresses to PublicKeys for this batch
      const batchPublicKeys = batch.map((wallet) => new PublicKey(wallet));

      // Get the completedList PDA
      const [completedListPDA, completedListBump] = await findCompletedListPDA(
        challengePDA
      );
      console.log(
        `Completed list PDA for batch ${
          batchIndex + 1
        }: ${completedListPDA.toString()}`
      );

      try {
        // Submit the admin_complete_challenges instruction for this batch
        console.log(
          `Submitting admin_complete_challenges transaction for batch ${
            batchIndex + 1
          }...`
        );
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

        console.log(
          `Batch ${batchIndex + 1} transaction submitted: ${adminCompleteTx}`
        );

        // Wait for confirmation
        await connection.confirmTransaction(adminCompleteTx, "confirmed");
        console.log(`Batch ${batchIndex + 1} transaction confirmed`);
      } catch (error) {
        console.error(`Error processing batch ${batchIndex + 1}:`, error);

        // Log the error details for debugging
        if (error instanceof Error) {
          console.error("Error message:", error.message);
          console.error("Error stack:", error.stack);
        }

        // Continue with the next batch instead of failing completely
        console.log(`Continuing with next batch...`);
      }
    }

    // After all batches are processed, finalize the challenge
    try {
      console.log("Finalizing challenge...");
      const finalizeTx = await program.methods
        .finalizeChallenge()
        .accounts({
          challenge: challengePDA,
          admin: adminKeypair.publicKey,
        })
        .signers([adminKeypair])
        .rpc();

      console.log(`finalize_challenge transaction submitted: ${finalizeTx}`);

      // Wait for confirmation
      await connection.confirmTransaction(finalizeTx, "confirmed");
      console.log("Finalize transaction confirmed");

      console.log(
        `Successfully submitted all wallet batches to contract for challenge ${challenge.challengeId}`
      );
      return true;
    } catch (error) {
      console.error("Error finalizing challenge:", error);

      // Log the error details for debugging
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }

      return false;
    }
  } catch (error) {
    console.error("Error setting up contract submission:", error);
    return false;
  }
};

export default {
  initCronJobs,
};
