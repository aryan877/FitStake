import { Request, Response } from 'express';
import { ChallengeModel } from '../models/Challenge';
import { ParticipationModel } from '../models/Participation';
import { Connection, PublicKey } from '@solana/web3.js';

export const createChallenge = async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      type,
      goal,
      unit,
      stakeAmount,
      startDate,
      endDate
    } = req.body;

    // Generate Solana escrow account
    const connection = new Connection(process.env.SOLANA_RPC_URL!);
    // Here you would interact with your Solana program to create escrow
    // This is a placeholder for the actual Solana program interaction
    const escrowAddress = new PublicKey(process.env.PROGRAM_ID!).toString();

    const challenge = new ChallengeModel({
      title,
      description,
      type,
      goal,
      unit,
      stakeAmount,
      startDate,
      endDate,
      escrowAddress
    });

    await challenge.save();

    res.status(201).json(challenge);
  } catch (error) {
    res.status(500).json({ error: 'Error creating challenge' });
  }
};

export const getChallenges = async (req: Request, res: Response) => {
  try {
    const challenges = await ChallengeModel.find({
      status: { $in: ['pending', 'active'] }
    });
    res.json(challenges);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching challenges' });
  }
};

export const joinChallenge = async (req: Request, res: Response) => {
  try {
    const { challengeId } = req.params;
    const { stakeTxId } = req.body;
    const userId = req.user!.userId;

    // Verify the stake transaction on Solana
    const connection = new Connection(process.env.SOLANA_RPC_URL!);
    // Here you would verify the transaction is confirmed and valid
    // This is a placeholder for the actual verification logic

    const participation = new ParticipationModel({
      userId,
      challengeId,
      stakeTxId
    });

    await participation.save();

    res.status(201).json(participation);
  } catch (error) {
    res.status(500).json({ error: 'Error joining challenge' });
  }
};

export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const { challengeId } = req.params;

    const leaderboard = await ParticipationModel.find({ challengeId })
      .sort({ completionPercentage: -1 })
      .populate('userId', 'email')
      .limit(10);

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching leaderboard' });
  }
};