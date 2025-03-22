import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { PrivyTokenPayload } from "../types";

declare global {
  namespace Express {
    interface Request {
      user?: {
        did: string;
        sessionId: string;
      };
    }
  }
}

export const authenticatePrivyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extract token from header or cookie
    const token =
      (req.headers.authorization?.startsWith("Bearer ") &&
        req.headers.authorization.split(" ")[1]) ||
      req.cookies?.["privy-token"];

    if (!token) {
      console.log("Auth failed: No token provided");
      return res
        .status(401)
        .json({ error: "No authentication token provided" });
    }

    // Get the verification key from environment variables
    const verificationKey = process.env.PRIVY_VERIFICATION_KEY;
    const appId = process.env.PRIVY_APP_ID;

    if (!verificationKey) {
      console.error("Missing Privy verification key in environment variables");
      return res.status(500).json({ error: "Server configuration error" });
    }

    // Verify the token
    jwt.verify(
      token,
      verificationKey,
      {
        algorithms: ["ES256"],
        issuer: "privy.io",
        audience: appId,
      },
      (err: any, decoded: any) => {
        if (err) {
          console.error("Token verification error:", err.message);
          return res.status(401).json({ error: "Invalid or expired token" });
        }

        const payload = decoded as PrivyTokenPayload;
        console.log(`User authenticated: ${payload.sub}`);

        // Set user info on request for use in route handlers
        req.user = {
          did: payload.sub,
          sessionId: payload.sid,
        };

        next();
      }
    );
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res
      .status(500)
      .json({ error: "Authentication failed due to server error" });
  }
};

// Optional middleware to require authentication
export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    console.log("Access denied: Authentication required");
    return res.status(401).json({ error: "Authentication required" });
  }
  console.log(`Authorized access for user: ${req.user.did}`);
  next();
};
