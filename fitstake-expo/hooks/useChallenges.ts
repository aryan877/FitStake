import { usePrivy } from '@privy-io/expo';
import { AnchorProvider, BN, Program, web3 } from '@project-serum/anchor';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { useCallback, useState } from 'react';
import { challengeApi, StepsData } from '../app/services/api';
import { useSolanaWallet } from './useSolanaWallet';

// Import the IDL
import IDL from '../src/idl/accountability.json';

// Get RPC URL from environment variables or use devnet as fallback
const SOLANA_RPC_URL =
  process.env.EXPO_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';

// Accountability program ID
const PROGRAM_ID = new PublicKey(
  'Aky9S499wn2Je1h6DAkV3JWqszYK8LHa2uJkCjwHJnnQ'
);

// Interface for challenge creation parameters
interface CreateChallengeParams {
  title: string;
  description: string;
  stakeAmount: number; // in lamports
  startTime: number; // unix timestamp
  endTime: number; // unix timestamp
  minParticipants: number;
  maxParticipants: number;
  goalSteps: number;
}

// Interface for challenge data
export interface ChallengeData {
  id: string;
  solanaChallengePda: string;
  solanaVaultPda: string;
  authority: string;
  admin: string;
  title: string;
  description: string;
  type: 'STEPS';
  goal: {
    value: number;
    unit: string;
  };
  startTime: number;
  endTime: number;
  stakeAmount: number;
  minParticipants: number;
  maxParticipants: number;
  participantCount: number;
  totalStake: number;
  token: string;
  isActive: boolean;
  isCompleted: boolean;
  participants: Array<{
    walletAddress: string;
    did?: string;
    stakeAmount: number;
    completed: boolean;
    claimed: boolean;
    joinedAt: Date;
    healthData?: StepsData[];
    progress?: number;
  }>;
}

// Interface for challenge progress
export interface ChallengeProgress {
  challengeId: string;
  progress: number;
  isCompleted: boolean;
  totalSteps: number;
}

// Define filter parameters interface
export interface ChallengeFilters {
  type?: string;
  status?: string;
  minStake?: number;
  maxStake?: number;
  minGoal?: number;
  maxGoal?: number;
  minParticipants?: number;
  maxParticipants?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * Creates a wallet adapter for Anchor
 */
const createWalletAdapter = (walletAddress: string) => {
  return {
    publicKey: new PublicKey(walletAddress),
    signTransaction: async (tx: web3.Transaction) => tx,
    signAllTransactions: async (txs: web3.Transaction[]) => txs,
  };
};

/**
 * Hook for interacting with fitness challenges on Solana
 */
export const useChallenges = () => {
  const { user } = usePrivy();
  const authenticated = !!user;
  const {
    address: walletAddress,
    connection,
    sendTransaction,
  } = useSolanaWallet();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [challenges, setChallenges] = useState<ChallengeData[]>([]);
  const [submittingData, setSubmittingData] = useState(false);
  const [filterParams, setFilterParams] = useState<ChallengeFilters>({
    status: 'active',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    limit: 10,
    page: 1,
  });

  /**
   * Initializes and returns the Anchor program instance
   */
  const getAnchorProgram = useCallback(async () => {
    if (!walletAddress) {
      throw new Error('Wallet address not found');
    }

    // Use existing connection or create a new one
    const conn = connection || new Connection(SOLANA_RPC_URL, 'confirmed');

    // Create wallet adapter
    const wallet = createWalletAdapter(walletAddress);

    // Create provider
    const provider = new AnchorProvider(conn, wallet, {
      preflightCommitment: 'confirmed',
    });

    // Create program
    const program = new Program(IDL as any, PROGRAM_ID, provider);

    return program;
  }, [walletAddress, connection]);

  /**
   * Fetches all challenges based on current filters
   */
  const fetchChallenges = useCallback(
    async (filters?: ChallengeFilters) => {
      setLoading(true);
      setError(null);

      // Update filters if provided
      if (filters) {
        setFilterParams((prevFilters) => ({
          ...prevFilters,
          ...filters,
        }));
      }

      // Use current filters or the ones passed in
      const queryParams = filters || filterParams;

      try {
        const response = await challengeApi.getAll(queryParams);

        if (response.success && response.data && response.data.challenges) {
          setChallenges(response.data.challenges);
        } else {
          setChallenges([]);
        }

        setLoading(false);
        return response.data?.challenges || [];
      } catch (err: any) {
        console.error('Error fetching challenges:', err);
        setError(
          `Failed to fetch challenges: ${err.message || 'Unknown error'}`
        );
        setLoading(false);
        return [];
      }
    },
    [filterParams]
  );

  /**
   * Updates filter parameters and refetches challenges
   */
  const updateFilters = useCallback(
    async (newFilters: Partial<ChallengeFilters>) => {
      const updatedFilters = {
        ...filterParams,
        ...newFilters,
        // Reset to page 1 when filters change
        page: newFilters.page || 1,
      };

      setFilterParams(updatedFilters);
      return fetchChallenges(updatedFilters);
    },
    [filterParams, fetchChallenges]
  );

  /**
   * Creates a new fitness challenge
   */
  const createChallenge = useCallback(
    async (params: CreateChallengeParams) => {
      if (!authenticated || !walletAddress) {
        setError('User not authenticated');
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        // Generate a unique challenge ID (shorter to avoid size issues)
        const timestamp = Math.floor(Date.now() / 1000); // Unix timestamp (seconds)
        const random = Math.floor(Math.random() * 10000); // 4-digit random number
        const challengeId = `c_${timestamp}_${random}`;

        // Get Anchor program
        const program = await getAnchorProgram();

        // Prepare parameters for the smart contract
        const stakeAmount = new BN(params.stakeAmount);
        const startTime = new BN(params.startTime);
        const endTime = new BN(params.endTime);
        const minParticipants = params.minParticipants;
        const maxParticipants = params.maxParticipants;

        // Find the PDA for the challenge account
        const [challengePda] = await PublicKey.findProgramAddressSync(
          [Buffer.from('challenge'), Buffer.from(challengeId)],
          program.programId
        );

        // Find the PDA for the vault account
        const [vaultPda] = await PublicKey.findProgramAddressSync(
          [Buffer.from('vault'), challengePda.toBuffer()],
          program.programId
        );

        // Log important details for debugging
        console.log('Creating challenge with params:', {
          challengeId,
          stakeAmount: stakeAmount.toString(),
          startTime: startTime.toString(),
          endTime: endTime.toString(),
          minParticipants,
          maxParticipants,
        });
        console.log('Challenge PDA:', challengePda.toString());
        console.log('Vault PDA:', vaultPda.toString());
        console.log('User wallet:', walletAddress);

        // Build the transaction with the proper account structure
        const tx = await program.methods
          .createChallenge(
            challengeId,
            stakeAmount,
            startTime,
            endTime,
            minParticipants,
            maxParticipants
          )
          .accounts({
            challenge: challengePda,
            authority: new PublicKey(walletAddress),
            systemProgram: SystemProgram.programId,
          })
          .transaction();

        // Update transaction fee payer and recent blockhash
        tx.feePayer = new PublicKey(walletAddress);

        // Send the transaction
        const result = await sendTransaction(tx);
        if (!result.success) {
          console.error('Transaction error:', result.error);
          throw new Error(`Failed to send transaction: ${result.error}`);
        }

        console.log('Transaction sent successfully:', result.signature);

        // Create the challenge in the backend for indexing and UI
        const backendData = {
          challengeId,
          solanaChallengePda: challengePda.toString(),
          solanaVaultPda: vaultPda.toString(),
          title: params.title,
          description: params.description,
          type: 'STEPS',
          goal: {
            value: params.goalSteps,
            unit: 'steps',
          },
          startTime: params.startTime,
          endTime: params.endTime,
          stakeAmount: params.stakeAmount,
          minParticipants: params.minParticipants,
          maxParticipants: params.maxParticipants,
          token: 'SOL', // Always SOL
          solanaTxId: result.signature,
        };

        // Submit to backend for indexing
        const response = await challengeApi.createChallenge(backendData);

        if (response.success) {
          fetchChallenges(); // Refresh the challenges list
          setLoading(false);
          return response.data;
        } else {
          throw new Error('Failed to create challenge in backend');
        }
      } catch (err: any) {
        console.error('Error creating challenge:', err);
        setError(
          `Failed to create challenge: ${err.message || 'Unknown error'}`
        );
        setLoading(false);
        return null;
      }
    },
    [authenticated, walletAddress, getAnchorProgram, sendTransaction]
  );

  /**
   * Joins an existing challenge
   */
  const joinChallenge = useCallback(
    async (challengeId: string) => {
      if (!authenticated || !walletAddress) {
        setError('User not authenticated');
        return false;
      }

      setError(null);

      try {
        // Get challenge details from backend
        const challengeResponse = await challengeApi.getById(challengeId);
        const challenge = challengeResponse.data;

        if (!challenge) {
          throw new Error('Challenge not found');
        }

        console.log('Joining challenge:', challengeId);
        console.log('Challenge data:', challenge);
        console.log('User wallet:', walletAddress);

        // Check if user is already a participant
        const isAlreadyParticipant = challenge.participants.some(
          (p: { walletAddress: string }) => p.walletAddress === walletAddress
        );

        if (isAlreadyParticipant) {
          setError('You are already a participant in this challenge');
          return false;
        }

        // Get Anchor program
        const program = await getAnchorProgram();

        // Get the challenge and vault PDAs
        const challengePda = new PublicKey(challenge.solanaChallengePda);
        const vaultPda = new PublicKey(challenge.solanaVaultPda);
        const walletPubkey = new PublicKey(walletAddress);

        // Find the PDA for the participant
        const [participantPda] = await PublicKey.findProgramAddressSync(
          [
            Buffer.from('participant'),
            challengePda.toBuffer(),
            walletPubkey.toBuffer(),
          ],
          program.programId
        );

        console.log('Participant PDA:', participantPda.toString());
        console.log('Challenge PDA:', challengePda.toString());
        console.log('Vault PDA:', vaultPda.toString());

        // Build the transaction
        const tx = await program.methods
          .joinChallenge()
          .accounts({
            challenge: challengePda,
            participant: participantPda,
            vault: vaultPda,
            participantAuthority: walletPubkey,
            systemProgram: SystemProgram.programId,
          })
          .transaction();

        // Send the transaction
        const result = await sendTransaction(tx);
        if (!result.success) {
          throw new Error(`Failed to send transaction: ${result.error}`);
        }

        console.log('Join transaction sent successfully:', result.signature);

        // Update the backend
        const response = await challengeApi.joinChallenge(challengeId);

        // Update challenges list locally instead of reloading everything
        setChallenges((currentChallenges) => {
          return currentChallenges.map((c) => {
            if (c.id === challengeId) {
              // Create updated challenge with new participant and counts
              return {
                ...c,
                participantCount: c.participantCount + 1,
                totalStake: c.totalStake + c.stakeAmount,
                participants: [
                  ...c.participants,
                  {
                    walletAddress,
                    stakeAmount: c.stakeAmount,
                    completed: false,
                    claimed: false,
                    joinedAt: new Date(),
                  },
                ],
                isActive: c.participantCount + 1 >= c.minParticipants,
              };
            }
            return c;
          });
        });

        return response.success;
      } catch (err: any) {
        console.error('Error joining challenge:', err);
        setError(`Failed to join challenge: ${err.message || 'Unknown error'}`);
        return false;
      }
    },
    [
      authenticated,
      walletAddress,
      getAnchorProgram,
      sendTransaction,
      // Remove fetchChallenges from dependencies
    ]
  );

  /**
   * Fetches a single challenge by ID
   */
  const fetchChallengeById = useCallback(async (challengeId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await challengeApi.getById(challengeId);

      setLoading(false);
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error('Challenge not found');
      }
    } catch (err: any) {
      console.error(`Error fetching challenge ${challengeId}:`, err);
      setError(`Failed to fetch challenge: ${err.message || 'Unknown error'}`);
      setLoading(false);
      return null;
    }
  }, []);

  /**
   * Submits health data for a challenge
   */
  const submitHealthData = useCallback(
    async (
      challengeId: string,
      healthData: StepsData[],
      targetSteps: number
    ) => {
      if (!authenticated) {
        setError('User not authenticated');
        return {
          success: false,
          error: 'User not authenticated',
        };
      }

      setSubmittingData(true);
      setError(null);

      try {
        // Calculate total steps and progress
        const totalSteps = healthData.reduce((sum, day) => sum + day.count, 0);
        const progress = Math.min(
          100,
          Math.round((totalSteps / targetSteps) * 100)
        );

        // Determine if challenge is completed based on reaching the target
        const isCompleted = totalSteps >= targetSteps;

        // Submit data to backend for verification
        const response = await challengeApi.submitHealthData(challengeId, {
          healthData,
          progress,
          isCompleted,
        });

        setSubmittingData(false);

        if (response.success) {
          return {
            success: true,
            progress,
            isCompleted,
            totalSteps,
          };
        } else {
          throw new Error('Failed to submit health data');
        }
      } catch (err: any) {
        console.error('Failed to submit health data for challenge:', err);
        setError(
          `Failed to submit health data: ${err.message || 'Unknown error'}`
        );
        setSubmittingData(false);
        return {
          success: false,
          error: 'Failed to submit health data',
        };
      }
    },
    [authenticated]
  );

  /**
   * Claims rewards for a completed challenge
   */
  const claimReward = useCallback(
    async (challengeId: string) => {
      if (!authenticated || !walletAddress) {
        setError('User not authenticated');
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        // Get challenge details from backend
        const challengeResponse = await challengeApi.getById(challengeId);
        const challenge = challengeResponse.data;

        if (!challenge) {
          throw new Error('Challenge not found');
        }

        console.log('Claiming reward for challenge:', challengeId);
        console.log('Challenge data:', challenge);
        console.log('User wallet:', walletAddress);

        // Get Anchor program
        const program = await getAnchorProgram();

        // Get the necessary PDAs and wallet
        const challengePda = new PublicKey(challenge.solanaChallengePda);
        const vaultPda = new PublicKey(challenge.solanaVaultPda);
        const walletPubkey = new PublicKey(walletAddress);

        // Find the PDA for the completed list
        const [completedListPda] = await PublicKey.findProgramAddressSync(
          [Buffer.from('completed_list'), challengePda.toBuffer()],
          program.programId
        );

        // Find the PDA for the participant account
        const [participantPda] = await PublicKey.findProgramAddressSync(
          [
            Buffer.from('participant'),
            challengePda.toBuffer(),
            walletPubkey.toBuffer(),
          ],
          program.programId
        );

        console.log('Participant PDA:', participantPda.toString());
        console.log('CompletedList PDA:', completedListPda.toString());
        console.log('Challenge PDA:', challengePda.toString());
        console.log('Vault PDA:', vaultPda.toString());

        // Build the transaction
        const tx = await program.methods
          .claimReward()
          .accounts({
            challenge: challengePda,
            participant: participantPda,
            completedList: completedListPda,
            vault: vaultPda,
            participantAuthority: walletPubkey,
            systemProgram: SystemProgram.programId,
          })
          .transaction();

        // Send the transaction
        const result = await sendTransaction(tx);
        if (!result.success) {
          throw new Error(`Failed to send transaction: ${result.error}`);
        }

        console.log(
          'Claim reward transaction sent successfully:',
          result.signature
        );

        // Refresh the challenges to update the UI
        fetchChallenges();

        setLoading(false);
        return true;
      } catch (err: any) {
        console.error('Error claiming reward:', err);
        setError(`Failed to claim reward: ${err.message || 'Unknown error'}`);
        setLoading(false);
        return false;
      }
    },
    [
      authenticated,
      walletAddress,
      getAnchorProgram,
      sendTransaction,
      fetchChallenges,
    ]
  );

  return {
    loading,
    error,
    challenges,
    submittingData,
    filterParams,
    createChallenge,
    joinChallenge,
    fetchChallenges,
    updateFilters,
    fetchChallengeById,
    submitHealthData,
    claimReward,
  };
};
