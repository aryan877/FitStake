import { NextFunction, Request, Response } from "express";
import UserModel from "../models/user.model";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";

/**
 * Check if a user is an admin
 * This is public for client-side validation
 */
export const checkAdminStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new ApiError(401, "Authentication required"));
    }

    const { did } = req.user;

    // Check if the user is an admin
    const user = await UserModel.findOne({ privyId: did });
    if (!user) {
      return next(new ApiError(404, "User not found"));
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          isAdmin: user.isAdmin || false,
        },
        "Admin status retrieved successfully"
      )
    );
  } catch (error) {
    console.error("Error checking admin status:", error);
    return next(new ApiError(500, "Failed to check admin status"));
  }
};
