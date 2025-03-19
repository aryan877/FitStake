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
    title: "30 Minute Workout Streak",
    description:
      "Exercise for at least 30 minutes every day for 5 days. Track your workouts to win!",
    type: "WORKOUT",
    goal: {
      value: 30,
      unit: "minutes",
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
    title: "8 Hour Sleep Challenge",
    description:
      "Sleep at least 8 hours every night for 7 days to improve your health and win rewards!",
    type: "SLEEP",
    goal: {
      value: 8,
      unit: "hours",
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
    title: "Meditation Streak",
    description:
      "Meditate for at least 10 minutes daily for the next 10 days to build a healthy habit!",
    type: "CUSTOM",
    goal: {
      value: 10,
      unit: "minutes",
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
      fitnessIntegrations: {
        googleFit: { connected: false },
        appleHealth: { connected: false },
        fitbit: { connected: false },
      },
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
