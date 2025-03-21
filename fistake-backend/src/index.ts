import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import morgan from "morgan";

import { errorHandler, notFound } from "./middleware/error.middleware";
import authRoutes from "./routes/auth.routes";
import challengeRoutes from "./routes/challenge.routes";
import healthRoutes from "./routes/health.routes";

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "*", // Allow all origins while testing with Expo Go
    credentials: true, // Allow cookies to be sent with requests
  })
);
app.use(helmet());
app.use(morgan("dev"));

// Routes
app.use("/api/challenges", challengeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/health", healthRoutes);

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Not found middleware
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoURI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/fitstake";
    await mongoose.connect(mongoURI);
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};

connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
