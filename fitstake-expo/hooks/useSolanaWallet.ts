import { useEmbeddedSolanaWallet } from '@privy-io/expo';
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
  VersionedTransaction,
  clusterApiUrl,
} from '@solana/web3.js';
import { useCallback, useEffect, useState } from 'react';
import { authApi } from '../app/services/api';

export interface TransactionInfo {
  signature: string;
  timestamp: Date;
  amount: number;
  isReceived: boolean;
  type: string;
}

export interface SolanaWalletState {
  address: string | null;
  balance: number | null;
  isLoading: boolean;
  error: string | null;
  connectionStatus: 'uninitialized' | 'initializing' | 'ready' | 'error';
  transactions: TransactionInfo[];
  isLoadingTx: boolean;
}

/**
 * Hook for interacting with Solana wallet functionality
 * Provides wallet address, balance, transaction management,
 * and blockchain interaction capabilities
 */
export const useSolanaWallet = () => {
  const { wallets } = useEmbeddedSolanaWallet();
  const [state, setState] = useState<SolanaWalletState>({
    address: null,
    balance: null,
    isLoading: true,
    error: null,
    connectionStatus: 'uninitialized',
    transactions: [],
    isLoadingTx: false,
  });
  const [connection, setConnection] = useState<Connection | null>(null);

  /**
   * Initializes connection to Solana blockchain
   * Uses environment RPC URL or defaults to devnet
   */
  const initializeConnection = useCallback(async () => {
    if (connection) return connection;

    setState((prev) => ({ ...prev, connectionStatus: 'initializing' }));

    try {
      const rpcUrl =
        process.env.EXPO_PUBLIC_SOLANA_RPC_URL || clusterApiUrl('devnet');
      const conn = new Connection(rpcUrl, 'confirmed');
      setConnection(conn);
      setState((prev) => ({ ...prev, connectionStatus: 'ready' }));
      return conn;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: 'Failed to connect to Solana network',
        isLoading: false,
        connectionStatus: 'error',
      }));
      return null;
    }
  }, [connection]);

  /**
   * Gets the Solana wallet provider from Privy
   * Returns null if no wallets are available
   */
  const getProvider = useCallback(async () => {
    if (!wallets || wallets.length === 0) return null;
    const wallet = wallets[0];
    if (!wallet) return null;
    return wallet.getProvider();
  }, [wallets]);

  /**
   * Fetches wallet address from backend profile
   * and current balance from Solana blockchain
   */
  const fetchWalletInfo = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Ensure connection is initialized
      const conn = connection || (await initializeConnection());

      if (!conn) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: 'Could not establish Solana connection',
        }));
        return;
      }

      // Get wallet address from backend user profile
      const response = await authApi.getUserProfile();
      const walletAddress = response?.data?.walletAddress;

      if (!walletAddress) {
        setState((prev) => ({
          ...prev,
          address: null,
          balance: null,
          isLoading: false,
          error: 'Wallet address not available from backend',
        }));
        return;
      }

      // Set the wallet address
      setState((prev) => ({
        ...prev,
        address: walletAddress,
      }));

      try {
        // Validate the public key
        const publicKey = new PublicKey(walletAddress);

        // Get balance using the connection
        const balanceInLamports = await conn.getBalance(publicKey);
        const balanceInSol = balanceInLamports / LAMPORTS_PER_SOL;

        setState((prev) => ({
          ...prev,
          balance: balanceInSol,
          isLoading: false,
          error: null,
        }));
      } catch (balanceError) {
        setState((prev) => ({
          ...prev,
          balance: 0,
          isLoading: false,
          error:
            'Failed to fetch balance: ' +
            (balanceError instanceof Error
              ? balanceError.message
              : String(balanceError)),
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error:
          'Failed to fetch wallet information: ' +
          (error instanceof Error ? error.message : String(error)),
      }));
    }
  }, [connection, initializeConnection]);

  /**
   * Sends a transaction to the Solana blockchain
   * Uses Privy's embedded wallet provider to sign and send
   */
  const sendTransaction = useCallback(
    async (
      transaction: Transaction | VersionedTransaction
    ): Promise<{ success: boolean; signature?: string; error?: string }> => {
      try {
        // Ensure connection is initialized
        const conn = connection || (await initializeConnection());

        if (!conn) {
          return {
            success: false,
            error: 'Could not establish Solana connection',
          };
        }

        if (!state.address) {
          return {
            success: false,
            error: 'Wallet address not available',
          };
        }

        const provider = await getProvider();

        if (!provider) {
          return { success: false, error: 'Provider not available' };
        }

        // Set recent blockhash and fee payer if it's a legacy transaction
        if (transaction instanceof Transaction) {
          const { blockhash, lastValidBlockHeight } =
            await conn.getLatestBlockhash('finalized');
          transaction.recentBlockhash = blockhash;
          transaction.lastValidBlockHeight = lastValidBlockHeight;

          // Set fee payer to the user's wallet
          transaction.feePayer = new PublicKey(state.address);

          console.log('Transaction prepared:', {
            feePayer: transaction.feePayer.toString(),
            recentBlockhash: transaction.recentBlockhash,
            numInstructions: transaction.instructions.length,
          });

          // Verify the transaction before sending
          try {
            const simulation = await conn.simulateTransaction(transaction);
            if (simulation.value.err) {
              console.error('Transaction simulation failed:', simulation.value);

              // Extract more detailed error information
              let errorMsg = 'Simulation error';
              if (simulation.value.logs && simulation.value.logs.length > 0) {
                const errorLogs = simulation.value.logs
                  .filter(
                    (log) =>
                      log.includes('Error') ||
                      log.includes('error') ||
                      log.includes('failed')
                  )
                  .join('\n');
                errorMsg = `${errorMsg}: ${errorLogs}`;
              } else {
                errorMsg = `${errorMsg}: ${JSON.stringify(
                  simulation.value.err
                )}`;
              }

              return {
                success: false,
                error: errorMsg,
              };
            }
            console.log('Transaction simulation succeeded');
          } catch (simError) {
            console.error('Failed to simulate transaction:', simError);
            // Continue with the transaction even if simulation fails
          }
        }

        console.log('Sending transaction...');
        const { signature } = await provider.request({
          method: 'signAndSendTransaction',
          params: {
            transaction,
            connection: conn,
          },
        });
        console.log('Transaction sent, signature:', signature);

        // Wait for confirmation
        try {
          const confirmation = await conn.confirmTransaction(
            signature,
            'confirmed'
          );
          if (confirmation.value.err) {
            console.error(
              'Transaction failed on-chain:',
              confirmation.value.err
            );
            return {
              success: false,
              error: `Transaction failed: ${JSON.stringify(
                confirmation.value.err
              )}`,
              signature,
            };
          }
          console.log('Transaction confirmed successfully');
        } catch (confirmError) {
          console.warn(
            'Could not confirm transaction, but it might still succeed:',
            confirmError
          );
          // Continue since the transaction was sent
        }

        // Refresh balance after transaction
        fetchWalletInfo();

        return { success: true, signature };
      } catch (error: any) {
        console.error('Transaction error:', error);
        // Try to extract more detailed error information
        const errorMessage = error?.message || 'Failed to send transaction';
        const errorLogs = error?.logs || [];
        if (errorLogs.length > 0) {
          console.error('Error logs:', errorLogs);
        }
        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    [
      connection,
      initializeConnection,
      getProvider,
      fetchWalletInfo,
      state.address,
    ]
  );

  /**
   * Signs a message using the Solana wallet
   * Returns the signature or error message
   */
  const signMessage = useCallback(
    async (
      message: string
    ): Promise<{ success: boolean; signature?: string; error?: string }> => {
      try {
        const provider = await getProvider();

        if (!provider) {
          return { success: false, error: 'Provider not available' };
        }

        const { signature } = await provider.request({
          method: 'signMessage',
          params: {
            message,
          },
        });

        return { success: true, signature };
      } catch (error: any) {
        return {
          success: false,
          error: error?.message || 'Failed to sign message',
        };
      }
    },
    [getProvider]
  );

  // Initialize connection on mount
  useEffect(() => {
    initializeConnection();
  }, [initializeConnection]);

  // Fetch wallet info when connection is ready
  useEffect(() => {
    if (state.connectionStatus === 'ready' && connection) {
      fetchWalletInfo();
    }
  }, [state.connectionStatus, connection, fetchWalletInfo]);

  /**
   * Fetches recent transactions for the current wallet
   * Processes transaction data to determine amounts and directions
   */
  const fetchRecentTransactions = useCallback(async () => {
    const { address } = state;
    if (!address || !connection) return;

    setState((prev) => ({ ...prev, isLoadingTx: true }));

    try {
      // Create a valid PublicKey object
      const pubKey = new PublicKey(address);

      // Get signatures with error handling
      const signatures = await connection.getSignaturesForAddress(pubKey, {
        limit: 10,
      });

      if (!signatures || signatures.length === 0) {
        // No transactions found
        setState((prev) => ({
          ...prev,
          transactions: [],
          isLoadingTx: false,
        }));
        return;
      }

      // Process each transaction
      const txs = await Promise.all(
        signatures.map(async (sig) => {
          try {
            // Get transaction details with error handling
            const tx = await connection.getTransaction(sig.signature, {
              maxSupportedTransactionVersion: 0,
            });

            // Skip if transaction data is missing
            if (!tx || !tx.meta) {
              return {
                signature: sig.signature,
                timestamp: sig.blockTime
                  ? new Date(sig.blockTime * 1000)
                  : new Date(),
                amount: 0,
                isReceived: false,
                type: sig.memo || 'Transaction',
              };
            }

            // Find our wallet's index in the account keys
            const myAddressStr = address;
            let isReceived = false;
            let amount = 0;

            // Compare pre and post balances to determine transaction direction
            if (tx.meta && tx.meta.preBalances && tx.meta.postBalances) {
              // Get accounts from transaction
              let accountIndices = [];

              // Try to find our account in the account list - multiple approaches for compatibility
              if (tx.transaction.message) {
                // For legacy transactions
                if ('accountKeys' in tx.transaction.message) {
                  const accounts = tx.transaction.message.accountKeys;
                  for (let i = 0; i < accounts.length; i++) {
                    if (accounts[i].toString() === myAddressStr) {
                      accountIndices.push(i);
                    }
                  }
                }
                // For versioned transactions
                else if ('getAccountKeys' in tx.transaction.message) {
                  const accountKeys = tx.transaction.message.getAccountKeys();
                  const staticKeys = accountKeys?.staticAccountKeys || [];
                  for (let i = 0; i < staticKeys.length; i++) {
                    if (staticKeys[i].toString() === myAddressStr) {
                      accountIndices.push(i);
                    }
                  }
                }
              }

              // If we found our account, check balance change
              if (accountIndices.length > 0) {
                // Check first occurrence of our account
                const myIndex = accountIndices[0];
                const preBalance = tx.meta.preBalances[myIndex];
                const postBalance = tx.meta.postBalances[myIndex];
                const balanceChange = postBalance - preBalance;

                // Use absolute value for display, and set direction flag
                amount = Math.abs(balanceChange) / LAMPORTS_PER_SOL;
                isReceived = balanceChange > 0;
              } else {
                // Fallback: If we can't identify our account specifically
                const firstAccountBalanceChange =
                  tx.meta.postBalances[0] - tx.meta.preBalances[0];
                amount = Math.abs(firstAccountBalanceChange) / LAMPORTS_PER_SOL;
                isReceived = firstAccountBalanceChange > 0;
              }
            }

            return {
              signature: sig.signature,
              timestamp: sig.blockTime
                ? new Date(sig.blockTime * 1000)
                : new Date(),
              amount,
              isReceived,
              type: sig.memo || (isReceived ? 'Received' : 'Sent'),
            };
          } catch (txError) {
            // Return a placeholder for this transaction on error
            return {
              signature: sig.signature,
              timestamp: sig.blockTime
                ? new Date(sig.blockTime * 1000)
                : new Date(),
              amount: 0,
              isReceived: false,
              type: 'Unknown Transaction',
            };
          }
        })
      );

      setState((prev) => ({
        ...prev,
        transactions: txs,
        isLoadingTx: false,
      }));
    } catch (err) {
      setState((prev) => ({ ...prev, transactions: [], isLoadingTx: false }));
    }
  }, [connection, state.address]);

  // Fetch transactions when wallet info is available
  useEffect(() => {
    if (state.address && connection && state.connectionStatus === 'ready') {
      fetchRecentTransactions();
    }
  }, [
    state.address,
    connection,
    state.connectionStatus,
    fetchRecentTransactions,
  ]);

  return {
    ...state,
    connection,
    fetchWalletInfo,
    fetchRecentTransactions,
    sendTransaction,
    signMessage,
  };
};
