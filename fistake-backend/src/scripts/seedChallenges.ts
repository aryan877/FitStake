import dotenv from "dotenv";
import mongoose from "mongoose";
import Challenge from "../models/challenge.model";
import User from "../models/user.model";

// Load environment variables
dotenv.config();

// Test user information
const TEST_USER = {
  privyId: "cm8fz6t2g004qs5y34z6k3hg1",
  walletAddress: "5Q6p8sHorK5CUxFayutK5ovKcks92jq6vjfMwZtAMqSC",
};

// Challenge templates
const challengeTemplates = [
  {
    title: "10K Steps Daily Challenge",
    description:
      "Complete 10,000 steps every day for the next 7 days to win a share of the pool!",
    type: "STEPS",
    goal: {
      value: 10000,
      unit: "steps",
    },
    duration: {
      days: 7,
    },
    stake: {
      amount: 0.5,
      token: "SOL",
    },
  },
  {
    title: "5K Steps Challenge",
    description:
      "Complete 5,000 steps every day for the next 5 days. Perfect for beginners!",
    type: "STEPS",
    goal: {
      value: 5000,
      unit: "steps",
    },
    duration: {
      days: 5,
    },
    stake: {
      amount: 0.25,
      token: "SOL",
    },
  },
  {
    title: "Weekly Step Master",
    description:
      "Achieve 70,000 steps in a week to become a step master and earn rewards!",
    type: "STEPS",
    goal: {
      value: 70000,
      unit: "steps",
    },
    duration: {
      days: 7,
    },
    stake: {
      amount: 0.3,
      token: "SOL",
    },
  },
  {
    title: "Step Up Challenge",
    description:
      "Take 8,000 steps daily for the next 10 days to build a consistent walking habit!",
    type: "STEPS",
    goal: {
      value: 8000,
      unit: "steps",
    },
    duration: {
      days: 10,
    },
    stake: {
      amount: 0.2,
      token: "SOL",
    },
  },
];

// Function to create challenges for the test user
const createChallenges = async (userDid: string) => {
  const challenges = [];

  // Get the user to access their wallet address
  const user = await User.findOne({ privyId: userDid });
  if (!user) {
    throw new Error("Test user not found");
  }

  for (const template of challengeTemplates) {
    const now = new Date();
    const startDate = new Date(now);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + template.duration.days);

    const challenge = {
      ...template,
      duration: {
        ...template.duration,
        startDate,
        endDate,
      },
      participants: [
        {
          did: userDid,
          walletAddress: user.walletAddress,
          status: "ACTIVE",
          joinedAt: new Date(),
        },
      ],
      isActive: true,
      createdBy: userDid,
      poolAmount: template.stake.amount,
      completedCount: 0,
      totalParticipants: 1,
    };

    challenges.push(challenge);
  }

  return Challenge.insertMany(challenges);
};

async function seed() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log("Connected to MongoDB");

    // Reset collections
    await User.deleteMany({});
    await Challenge.deleteMany({});
    console.log("Collections reset");

    // Create test user
    const user = await User.create({
      privyId: TEST_USER.privyId,
      walletAddress: TEST_USER.walletAddress,
    });
    console.log("Test user created", user._id);

    // Create challenges
    const challenges = await createChallenges(TEST_USER.privyId);
    console.log(`Created ${challenges.length} challenges`);

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log("Database seeding completed successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

// Run the seed function
seed();
