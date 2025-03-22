import mongoose, { Document, Schema } from "mongoose";
import { Badge } from "../types";

interface BadgeDocument extends Omit<Badge, "id">, Document {
  id: string;
}

const badgeSchema = new Schema<BadgeDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    iconName: {
      type: String,
      required: true,
    },
    criteria: {
      type: String,
      required: true,
    },
    tier: {
      type: String,
      enum: ["bronze", "silver", "gold", "platinum"],
      required: true,
    },
    category: {
      type: String,
      enum: ["steps", "challenges", "social", "achievement", "special"],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<BadgeDocument>("Badge", badgeSchema);
