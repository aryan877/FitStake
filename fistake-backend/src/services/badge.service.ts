import BadgeModel from "../models/badge.model";
import UserModel from "../models/user.model";
import { Badge, UserStats } from "../types";

const predefinedBadges: Badge[] = [
  // Steps badges
  {
    id: "step_beginner",
    name: "Step Beginner",
    description: "Reach 10,000 total steps",
    iconName: "Footprints",
    criteria: "totalStepCount >= 10000",
    tier: "bronze",
    category: "steps",
  },
  {
    id: "step_intermediate",
    name: "Step Enthusiast",
    description: "Reach 100,000 total steps",
    iconName: "Footprints",
    criteria: "totalStepCount >= 100000",
    tier: "silver",
    category: "steps",
  },
  {
    id: "step_advanced",
    name: "Step Pro",
    description: "Reach 1,000,000 total steps",
    iconName: "Footprints",
    criteria: "totalStepCount >= 1000000",
    tier: "gold",
    category: "steps",
  },

  // Challenge badges
  {
    id: "challenge_joiner",
    name: "Challenge Joiner",
    description: "Join your first challenge",
    iconName: "Trophy",
    criteria: "challengesJoined >= 1",
    tier: "bronze",
    category: "challenges",
  },
  {
    id: "challenge_winner",
    name: "Challenge Winner",
    description: "Complete your first challenge",
    iconName: "Medal",
    criteria: "challengesCompleted >= 1",
    tier: "silver",
    category: "challenges",
  },
  {
    id: "challenge_master",
    name: "Challenge Master",
    description: "Complete 5 challenges",
    iconName: "Award",
    criteria: "challengesCompleted >= 5",
    tier: "gold",
    category: "challenges",
  },
  {
    id: "challenge_creator",
    name: "Challenge Creator",
    description: "Create your first challenge",
    iconName: "Crown",
    criteria: "challengesCreated >= 1",
    tier: "silver",
    category: "challenges",
  },
];

/**
 * Initialize badges in the database
 */
export const initializeBadges = async () => {
  try {
    const count = await BadgeModel.countDocuments();

    if (count === 0) {
      await BadgeModel.insertMany(predefinedBadges);
    }
  } catch (error) {
    console.error("Error initializing badges:", error);
  }
};

/**
 * Check and award badges to a user based on their stats
 */
export const checkAndAwardBadges = async (userId: string) => {
  try {
    // Get user with stats
    const user = await UserModel.findById(userId);
    if (!user || !user.stats) return [];

    // Get all badges
    const allBadges = await BadgeModel.find();

    // Get user's current badges
    const userBadgeIds = new Set(
      user.badges?.map((badge) => badge.badgeId) || []
    );

    // New badges to award
    const newBadges: string[] = [];

    // Check each badge
    for (const badge of allBadges) {
      // Skip if user already has this badge
      if (userBadgeIds.has(badge.id)) continue;

      // Check if user meets the criteria
      const isEligible = checkBadgeCriteria(badge, user.stats);

      if (isEligible) {
        newBadges.push(badge.id);
        user.badges = user.badges || [];
        user.badges.push({
          badgeId: badge.id,
          earnedAt: new Date(),
        });
      }
    }

    // Save user if they earned new badges
    if (newBadges.length > 0) {
      await user.save();
    }

    return newBadges;
  } catch (error) {
    console.error("Error checking badges:", error);
    return [];
  }
};

/**
 * Check if a user meets the criteria for a badge
 */
function checkBadgeCriteria(badge: Badge, stats: UserStats): boolean {
  try {
    // Simple criteria check using eval (in a controlled environment)
    // For example: "totalStepCount >= 10000"
    const statValues: Record<string, number> = {
      totalStepCount: stats.totalStepCount,
      challengesCompleted: stats.challengesCompleted,
      challengesJoined: stats.challengesJoined,
      challengesCreated: stats.challengesCreated,
      totalStaked: stats.totalStaked,
      totalEarned: stats.totalEarned,
      winRate: stats.winRate,
    };

    // Evaluate the criteria expression with the user's stats
    return new Function(...Object.keys(statValues), `return ${badge.criteria}`)(
      ...Object.values(statValues)
    );
  } catch (error) {
    console.error(`Error evaluating badge criteria: ${badge.criteria}`, error);
    return false;
  }
}

/**
 * Update a user's stats and check for new badges
 */
export const updateUserStats = async (
  userId: string,
  statsUpdate: Partial<UserStats>
) => {
  try {
    // Find user
    const user = await UserModel.findById(userId);
    if (!user) return null;

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
    Object.entries(statsUpdate).forEach(([key, value]) => {
      if (value !== undefined && key in user.stats!) {
        // @ts-ignore: Dynamic key access
        user.stats[key] = value;
      }
    });

    // Calculate win rate if needed
    if (user.stats.challengesJoined > 0) {
      user.stats.winRate =
        user.stats.challengesCompleted / user.stats.challengesJoined;
    }

    user.stats.lastUpdated = new Date();
    await user.save();

    // Check for new badges
    await checkAndAwardBadges(userId);

    return user;
  } catch (error) {
    console.error("Error updating user stats:", error);
    return null;
  }
};

export default {
  initializeBadges,
  checkAndAwardBadges,
  updateUserStats,
};
