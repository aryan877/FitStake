import express from 'express';
import { auth } from '../middleware/auth';
import {
  createChallenge,
  getChallenges,
  joinChallenge,
  getLeaderboard
} from '../controllers/challenges';

const router = express.Router();

router.post('/', auth, createChallenge);
router.get('/', getChallenges);
router.post('/:challengeId/join', auth, joinChallenge);
router.get('/:challengeId/leaderboard', getLeaderboard);

export default router;