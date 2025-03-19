import { Request, Response } from "express";
import UserModel from "../models/user.model";

export const createOrUpdateUser = async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.body;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const { did } = req.user;

    if (!walletAddress) {
      return res.status(400).json({ error: "Wallet address is required" });
    }

    // Find or create user
    const user = await UserModel.findOneAndUpdate(
      { privyId: did },
      {
        walletAddress,
        fitnessIntegrations: {
          googleFit: { connected: false },
          appleHealth: { connected: false },
          fitbit: { connected: false },
        },
      },
      {
        new: true,
        upsert: true,
      }
    );

    res.status(200).json({
      message: "User data saved successfully",
      user: {
        privyId: user.privyId,
        walletAddress: user.walletAddress,
      },
    });
  } catch (error) {
    console.error("User creation/update error:", error);
    res.status(500).json({ error: "Error saving user data" });
  }
};
