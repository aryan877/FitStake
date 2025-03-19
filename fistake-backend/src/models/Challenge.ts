import mongoose, { Schema } from 'mongoose';
import { Challenge } from '../types';

const challengeSchema = new Schema<Challenge>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['steps', 'distance', 'workout', 'custom']
  },
  goal: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    required: true
  },
  stakeAmount: {
    type: Number,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  escrowAddress: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'cancelled'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const ChallengeModel = mongoose.model<Challenge>('Challenge', challengeSchema);