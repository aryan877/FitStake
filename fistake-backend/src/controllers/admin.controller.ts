import { NextFunction, Request, Response } from "express";
import UserModel from "../models/user.model";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";

/** Check if user is admin (public for client validation) */
export const checkAdminStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) return next(new ApiError(401, "Authentication required"));

    const { did } = req.user;
    const user = await UserModel.findOne({ privyId: did });

    if (!user) return next(new ApiError(404, "User not found"));

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { isAdmin: user.isAdmin || false },
          "Admin status retrieved successfully"
        )
      );
  } catch (error) {
    console.error("Error checking admin status:", error);
    return next(new ApiError(500, "Failed to check admin status"));
  }
};
