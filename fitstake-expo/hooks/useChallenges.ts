import { usePrivy } from '@privy-io/expo';
import { AnchorProvider, BN, Program, web3 } from '@project-serum/anchor';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { useCallback, useState } from 'react';
import { challengeApi } from '../app/services/api';
import {
  ChallengeData,
  ChallengeFilters,
  ChallengeVisibility,
  CreateChallengeParams,
  StepsData,
} from '../types';
import { useSolanaWallet } from './useSolanaWallet';

// Import the IDL
import IDL from '../idl/accountability.json';

// Get RPC URL from environment variables or use devnet as fallback
const SOLANA_RPC_URL =
  process.env.EXPO_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';

// Get program ID from IDL metadata
const PROGRAM_ID = new PublicKey(IDL.metadata.address);

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

  // Initialize with default filters
  const [filterParams, setFilterParams] = useState<ChallengeFilters>({
    status: 'active',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    limit: 10,
    page: 1,
    visibility: 'public' as ChallengeVisibility,
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
    return new Program(IDL as any, PROGRAM_ID, provider);
  }, [walletAddress, connection]);

  /**
   * Fetches all challenges based on current filters
   */
  const fetchChallenges = useCallback(
    async (filters?: ChallengeFilters) => {
      setLoading(true);
      setError(null);

      try {
        // Update filters if provided
        if (filters) {
          setFilterParams((prevFilters) => ({
            ...prevFilters,
            ...filters,
          }));
        }

        // Use current filters or the ones passed in
        const queryParams = filters || filterParams;

        const response = await challengeApi.getAll(queryParams);

        if (response.success && response.data) {
          const { challenges: fetchedChallenges, pagination } = response.data;
          setChallenges(fetchedChallenges || []);
          return fetchedChallenges;
        } else {
          setChallenges([]);
          throw new Error(response.message || 'Failed to fetch challenges');
        }
      } catch (err: any) {
        console.error('Error fetching challenges:', err);
        setError(err.message || 'Failed to fetch challenges');
        setChallenges([]);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [filterParams]
  );

  /**
   * Updates filter parameters and refetches challenges
   */
  const updateFilters = useCallback(
    async (newFilters: Partial<ChallengeFilters>) => {
      // Create a copy of current filters
      const updatedFilters = { ...filterParams };

      // Update with new filter values, handling undefined properly
      Object.keys(newFilters).forEach((key) => {
        const typedKey = key as keyof ChallengeFilters;
        const value = newFilters[typedKey];

        // Only update if the value is different from current
        if (value !== updatedFilters[typedKey]) {
          if (value === undefined) {
            // If the value is undefined, explicitly set to undefined
            // to make sure we're not sending empty strings or invalid values
            updatedFilters[typedKey] = undefined;
          } else {
            // Type-safe assignment for defined values
            updatedFilters[typedKey] = value as any;
          }
        }
      });

      // Reset to page 1 when filters change, unless explicitly set
      if (newFilters.page === undefined) {
        updatedFilters.page = 1;
      }

      // Set the updated filters
      setFilterParams(updatedFilters);

      // Create API-friendly version of the filters
      const apiFilters = { ...updatedFilters };

      // Clean up filters before sending to API
      // Don't send 'any' status to the backend
      if (apiFilters.status === 'any') {
        delete apiFilters.status;
      }

      // Don't send empty string search text
      if (apiFilters.searchText === '') {
        delete apiFilters.searchText;
      }

      try {
        const result = await fetchChallenges(apiFilters);
        return result;
      } catch (error) {
        console.error('Error fetching challenges with filters:', error);
        throw error;
      }
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
        const timestamp = Math.floor(Date.now() / 1000);
        const random = Math.floor(Math.random() * 10000);
        const challengeId = `c_${timestamp}_${random}`;

        // Get Anchor program
        const program = await getAnchorProgram();

        // Find PDAs and prepare transaction
        const [challengePda] = await PublicKey.findProgramAddressSync(
          [Buffer.from('challenge'), Buffer.from(challengeId)],
          program.programId
        );

        const [vaultPda] = await PublicKey.findProgramAddressSync(
          [Buffer.from('vault'), challengePda.toBuffer()],
          program.programId
        );

        // Build and send transaction
        const tx = await program.methods
          .createChallenge(
            challengeId,
            new BN(params.stakeAmount),
            new BN(params.startTime),
            new BN(params.endTime),
            params.minParticipants,
            params.maxParticipants
          )
          .accounts({
            challenge: challengePda,
            authority: new PublicKey(walletAddress),
            systemProgram: SystemProgram.programId,
          })
          .transaction();

        tx.feePayer = new PublicKey(walletAddress);

        const result = await sendTransaction(tx);
        if (!result.success) {
          throw new Error(`Failed to send transaction: ${result.error}`);
        }

        // Create challenge in backend
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
          token: 'SOL',
          solanaTxId: result.signature,
          isPublic: params.isPublic || false,
          admin: program.programId.toString(),
        };

        const response = await challengeApi.createChallenge(backendData);

        if (response.success && response.data) {
          return response.data;
        } else {
          throw new Error(
            response.message || 'Failed to create challenge in backend'
          );
        }
      } catch (err: any) {
        console.error('Error creating challenge:', err);
        setError(err.message || 'Failed to create challenge');
        return null;
      } finally {
        setLoading(false);
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
        const response = await challengeApi.joinChallenge(challengeId);

        if (response.success) {
          // Refresh challenges list after successful join
          await fetchChallenges(filterParams);
          return true;
        } else {
          throw new Error(response.message || 'Failed to join challenge');
        }
      } catch (err: any) {
        console.error('Error joining challenge:', err);
        setError(err.message || 'Failed to join challenge');
        return false;
      }
    },
    [authenticated, walletAddress, fetchChallenges, filterParams]
  );

  /**
   * Fetches a single challenge by ID
   * Note: This function doesn't update the challenges state,
   * it just returns the challenge data for standalone use in detail pages
   */
  const fetchChallengeById = useCallback(async (challengeId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await challengeApi.getById(challengeId);

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Challenge not found');
      }
    } catch (err: any) {
      console.error(`Error fetching challenge ${challengeId}:`, err);
      setError(err.message || 'Failed to fetch challenge');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Submits health data for a challenge
   */
  const submitHealthData = useCallback(
    async (
      challengeId: string,
      healthData: StepsData[],
      targetSteps: number,
      platform?: string
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
        const response = await challengeApi.submitHealthData(
          challengeId,
          healthData,
          targetSteps,
          platform
        );

        if (response.success && response.data) {
          const totalSteps = healthData.reduce(
            (sum, day) => sum + day.count,
            0
          );

          const progressPercentage = Math.round(
            (totalSteps / targetSteps) * 100
          );

          return {
            success: true,
            progress: progressPercentage,
            isCompleted: response.data.isCompleted,
            totalSteps,
          };
        } else {
          throw new Error(response.message || 'Failed to submit health data');
        }
      } catch (err: any) {
        console.error('Failed to submit health data:', err);
        setError(err.message || 'Failed to submit health data');
        return {
          success: false,
          error: err.message || 'Failed to submit health data',
        };
      } finally {
        setSubmittingData(false);
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
        // Get challenge details
        const challengeResponse = await challengeApi.getById(challengeId);
        if (!challengeResponse.success || !challengeResponse.data) {
          throw new Error('Challenge not found');
        }

        const challenge = challengeResponse.data;

        // Get Anchor program and build transaction
        const program = await getAnchorProgram();
        const challengePda = new PublicKey(challenge.solanaChallengePda);
        const vaultPda = new PublicKey(challenge.solanaVaultPda);
        const walletPubkey = new PublicKey(walletAddress);

        const [participantPda] = await PublicKey.findProgramAddressSync(
          [
            Buffer.from('participant'),
            challengePda.toBuffer(),
            walletPubkey.toBuffer(),
          ],
          program.programId
        );

        const [completedListPda] = await PublicKey.findProgramAddressSync(
          [Buffer.from('completed_list'), challengePda.toBuffer()],
          program.programId
        );

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

        const result = await sendTransaction(tx);
        if (!result.success) {
          throw new Error(`Failed to send transaction: ${result.error}`);
        }

        // Update backend
        const response = await challengeApi.claimReward(
          challengeId,
          result.signature || ''
        );

        if (response.success) {
          // Refresh challenges after successful claim
          await fetchChallenges(filterParams);
          return true;
        } else {
          throw new Error(
            response.message || 'Failed to update backend after claiming'
          );
        }
      } catch (err: any) {
        console.error('Error claiming reward:', err);
        setError(err.message || 'Failed to claim reward');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [
      authenticated,
      walletAddress,
      getAnchorProgram,
      sendTransaction,
      fetchChallenges,
      filterParams,
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
