/**
 * Types related to Solana wallet functionality
 */

/**
 * Information about a transaction
 */
export interface TransactionInfo {
  signature: string;
  timestamp: Date;
  amount: number;
  isReceived: boolean;
  type: string;
}

/**
 * State for the Solana wallet
 */
export interface SolanaWalletState {
  address: string | null;
  balance: number | null;
  isLoading: boolean;
  error: string | null;
  connectionStatus: 'uninitialized' | 'initializing' | 'ready' | 'error';
  transactions: TransactionInfo[];
  isLoadingTx: boolean;
}
