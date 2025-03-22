import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  ExternalLink,
  Send,
  Wallet,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Clipboard,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSolanaWallet } from '../../hooks/useSolanaWallet';
import theme from '../theme';
import { showSuccessToast } from '../utils/errorHandling';

const { colors, spacing, borderRadius, fontSize, fontWeight, shadows } = theme;

export default function WalletScreen() {
  const {
    address,
    balance,
    isLoading,
    fetchWalletInfo,
    sendTransaction,
    connection,
    connectionStatus,
    transactions,
    isLoadingTx,
    fetchRecentTransactions,
  } = useSolanaWallet();

  // Send transaction modal
  const [sendModalVisible, setSendModalVisible] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState('');

  // Refresh balance state
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);

  // Format balance with 4 decimal places
  const formattedBalance = balance !== null ? balance.toFixed(4) : '0.0000';

  // Format SOL amount
  const formatSol = (value: number) => {
    return `${value.toFixed(4)} SOL`;
  };

  // Handle the send transaction action
  const handleSendTransaction = async () => {
    setSendError('');

    if (!recipientAddress.trim()) {
      setSendError('Recipient address is required');
      return;
    }

    if (!amount.trim() || parseFloat(amount) <= 0) {
      setSendError('Please enter a valid amount');
      return;
    }

    const amountValue = parseFloat(amount);
    if (balance === null || amountValue > balance) {
      setSendError('Insufficient balance');
      return;
    }

    if (!connection) {
      setSendError('Solana connection not available');
      return;
    }

    setIsSending(true);

    try {
      // Validate recipient address
      const toPublicKey = new PublicKey(recipientAddress);

      // Create a transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(address!),
          toPubkey: toPublicKey,
          lamports: Math.floor(amountValue * LAMPORTS_PER_SOL),
        })
      );

      // Set recent blockhash
      transaction.recentBlockhash = (
        await connection.getLatestBlockhash()
      ).blockhash;
      transaction.feePayer = new PublicKey(address!);

      // Send transaction
      const result = await sendTransaction(transaction);

      if (result.success) {
        showSuccessToast(`Successfully sent ${amountValue} SOL`);
        setSendModalVisible(false);
        setRecipientAddress('');
        setAmount('');

        // Refresh wallet info and transactions
        await fetchWalletInfo();
        await fetchRecentTransactions();
      } else {
        setSendError(result.error || 'Transaction failed');
      }
    } catch (error: any) {
      console.error('Send transaction error:', error);
      setSendError(error.message || 'Failed to send transaction');
    } finally {
      setIsSending(false);
    }
  };

  // Format date for transactions
  const formatDate = (date: Date) => {
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  };

  // Copy wallet address to clipboard
  const copyAddressToClipboard = () => {
    if (address) {
      Clipboard.setString(address);
      showSuccessToast('Wallet address copied to clipboard');
    }
  };

  // Open Solana devnet faucet
  const openDevnetFaucet = () => {
    Linking.openURL('https://faucet.solana.com');
  };

  // Only refresh the wallet balance
  const handleRefreshBalance = async () => {
    setIsRefreshingBalance(true);
    try {
      await fetchWalletInfo();
    } catch (error) {
      console.error('Error refreshing balance:', error);
    } finally {
      setIsRefreshingBalance(false);
    }
  };

  // Refresh transactions only
  const [isRefreshingTx, setIsRefreshingTx] = useState(false);

  const handleRefreshTransactions = async () => {
    if (!connection || connectionStatus !== 'ready') return;

    setIsRefreshingTx(true);
    try {
      await fetchRecentTransactions();
    } catch (error) {
      console.error('Error refreshing transactions:', error);
    } finally {
      setIsRefreshingTx(false);
    }
  };

  // Refresh both balance and transactions
  const handleRefreshAll = async () => {
    setIsRefreshingBalance(true);
    setIsRefreshingTx(true);

    try {
      await Promise.all([
        fetchWalletInfo(),
        connection && connectionStatus === 'ready'
          ? fetchRecentTransactions()
          : Promise.resolve(),
      ]);
    } catch (error) {
      console.error('Error refreshing wallet data:', error);
    } finally {
      setIsRefreshingBalance(false);
      setIsRefreshingTx(false);
    }
  };

  // Show loading indicator if connection is not ready
  if (
    (isLoading && !isRefreshingBalance) ||
    connectionStatus === 'initializing' ||
    connectionStatus === 'uninitialized'
  ) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.accent.primary} />
        <Text style={styles.message}>
          {connectionStatus === 'initializing'
            ? 'Connecting to Solana network...'
            : 'Loading wallet information...'}
        </Text>
      </View>
    );
  }

  // Show error if connection failed
  if (connectionStatus === 'error') {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={[styles.message, styles.errorText]}>
          Failed to connect to Solana network
        </Text>
        <TouchableOpacity
          style={[styles.actionButton, { marginTop: spacing.md }]}
          onPress={fetchWalletInfo}
        >
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Wallet</Text>
          <Text style={styles.subtitle}>Manage your funds</Text>
        </View>

        <View style={styles.walletAddressCard}>
          <Text style={styles.walletAddressLabel}>Your Wallet Address</Text>
          <View style={styles.addressRow}>
            <Text
              style={styles.walletAddressValue}
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {address ? address : 'No wallet connected'}
            </Text>
            {address && (
              <TouchableOpacity
                onPress={copyAddressToClipboard}
                style={styles.copyButton}
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              >
                <Copy size={18} color={colors.accent.primary} />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.devnetNoteContainer}>
            <Text style={styles.devnetNote}>
              This wallet uses Solana Devnet.
            </Text>
            <TouchableOpacity
              style={styles.faucetLink}
              onPress={openDevnetFaucet}
            >
              <Text style={styles.faucetLinkText}>
                Get free SOL from faucet
              </Text>
              <ExternalLink size={14} color={colors.accent.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.balanceCard}>
          <Wallet color={colors.white} size={32} />
          <Text style={styles.balanceLabel}>Available Balance</Text>
          {isRefreshingBalance ? (
            <View style={styles.balanceLoadingContainer}>
              <ActivityIndicator size="large" color={colors.accent.primary} />
              <Text style={styles.balanceLoadingText}>Updating balance...</Text>
            </View>
          ) : (
            <Text style={styles.balanceAmount}>{formattedBalance} SOL</Text>
          )}
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefreshBalance}
            disabled={isRefreshingBalance}
          >
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
          <View style={styles.buttonRow}>
            <Pressable
              style={styles.actionButton}
              onPress={() => setSendModalVisible(true)}
              disabled={
                !connection ||
                connectionStatus !== 'ready' ||
                isRefreshingBalance
              }
            >
              <Text style={styles.buttonText}>Send</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <View style={styles.transactionsList}>
          <View style={styles.transactionsHeader}>
            <Text style={styles.sectionSubtitle}>Transaction History</Text>
            <TouchableOpacity
              style={styles.refreshTxButton}
              onPress={handleRefreshTransactions}
            >
              {isRefreshingTx ? (
                <ActivityIndicator size="small" color={colors.accent.primary} />
              ) : (
                <Text style={styles.refreshButtonText}>Refresh</Text>
              )}
            </TouchableOpacity>
          </View>

          {isLoadingTx && !isRefreshingTx ? (
            <ActivityIndicator
              size="small"
              color={colors.accent.primary}
              style={styles.transactionsLoader}
            />
          ) : transactions.length > 0 ? (
            <>
              {transactions.map((tx, index) => (
                <View key={index} style={styles.transactionItem}>
                  <View style={styles.transactionIcon}>
                    {tx.isReceived ? (
                      <ArrowDownLeft
                        color={colors.accent.secondary}
                        size={20}
                      />
                    ) : (
                      <ArrowUpRight color={colors.accent.error} size={20} />
                    )}
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionTitle}>
                      {tx.isReceived ? 'Received' : 'Sent'}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {formatDate(tx.timestamp)}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.transactionAmount,
                      tx.isReceived ? styles.positive : styles.negative,
                    ]}
                  >
                    {tx.isReceived ? '+' : '-'}
                    {formatSol(tx.amount)}
                  </Text>
                </View>
              ))}
            </>
          ) : (
            <View style={styles.emptyTransactionsContainer}>
              <Send color={colors.gray[600]} size={32} />
              <Text style={styles.emptyTransactionsText}>
                No transactions found
              </Text>
              <TouchableOpacity
                style={styles.emptyStateRefreshButton}
                onPress={handleRefreshTransactions}
              >
                <Text style={styles.refreshButtonText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Send SOL Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={sendModalVisible}
        onRequestClose={() => setSendModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Send SOL</Text>

            <Text style={styles.inputLabel}>Recipient Address</Text>
            <TextInput
              style={styles.textInput}
              value={recipientAddress}
              onChangeText={setRecipientAddress}
              placeholder="Enter recipient wallet address"
              placeholderTextColor={colors.gray[400]}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.inputLabel}>Amount (SOL)</Text>
            <TextInput
              style={styles.textInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.0"
              placeholderTextColor={colors.gray[400]}
              keyboardType="numeric"
            />

            {sendError ? (
              <Text style={styles.errorText}>{sendError}</Text>
            ) : null}

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setSendModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.sendButton]}
                onPress={handleSendTransaction}
                disabled={isSending}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.sendButtonText}>Send</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: spacing.md,
    paddingTop: spacing.xxl + spacing.xl,
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.gray[400],
  },
  walletAddressCard: {
    margin: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.gray[900],
    borderRadius: borderRadius.xl,
    ...shadows.sm,
  },
  walletAddressLabel: {
    color: colors.gray[400],
    fontSize: fontSize.md,
    marginBottom: spacing.sm,
  },
  walletAddressValue: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    flex: 1,
    paddingRight: spacing.xs,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  copyButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  devnetNoteContainer: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  devnetNote: {
    color: colors.gray[400],
    fontSize: fontSize.sm,
    marginRight: spacing.xs,
  },
  faucetLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  faucetLinkText: {
    color: colors.accent.primary,
    fontSize: fontSize.sm,
    marginRight: spacing.xs,
  },
  balanceCard: {
    margin: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.gray[900],
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    ...shadows.md,
  },
  balanceLabel: {
    color: colors.gray[400],
    fontSize: fontSize.md,
    marginTop: spacing.sm,
  },
  balanceAmount: {
    color: colors.white,
    fontSize: 40,
    fontWeight: fontWeight.bold,
    marginTop: spacing.sm,
  },
  refreshButton: {
    marginTop: spacing.sm,
    padding: spacing.xs,
  },
  refreshButtonText: {
    color: colors.accent.primary,
    fontSize: fontSize.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  actionButton: {
    backgroundColor: colors.accent.primary,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    minWidth: 120,
    alignItems: 'center',
    ...shadows.sm,
  },
  buttonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  transactionsList: {
    padding: spacing.md,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[900],
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    backgroundColor: colors.gray[800],
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  transactionTitle: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  transactionDate: {
    color: colors.gray[400],
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  transactionAmount: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  positive: {
    color: colors.accent.secondary,
  },
  negative: {
    color: colors.accent.error,
  },
  message: {
    fontSize: fontSize.md,
    color: colors.gray[400],
    marginTop: spacing.md,
  },
  emptyTransactionsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.gray[900],
    borderRadius: borderRadius.lg,
  },
  emptyTransactionsText: {
    color: colors.gray[400],
    fontSize: fontSize.md,
    marginTop: spacing.md,
  },
  transactionsLoader: {
    padding: spacing.xl,
    alignSelf: 'center',
  },
  transactionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionSubtitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.white,
  },
  refreshTxButton: {
    padding: spacing.xs,
  },
  // Modal styles
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalView: {
    margin: spacing.md,
    backgroundColor: colors.gray[900],
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    width: '85%',
    ...shadows.lg,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  textInput: {
    backgroundColor: colors.gray[800],
    color: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    fontSize: fontSize.md,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  modalButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
  },
  cancelButton: {
    backgroundColor: colors.gray[700],
  },
  sendButton: {
    backgroundColor: colors.accent.primary,
  },
  cancelButtonText: {
    color: colors.white,
    fontWeight: fontWeight.medium,
  },
  sendButtonText: {
    color: colors.white,
    fontWeight: fontWeight.bold,
  },
  errorText: {
    color: colors.accent.error,
    fontSize: fontSize.sm,
    marginBottom: spacing.md,
  },
  emptyStateRefreshButton: {
    backgroundColor: colors.gray[800],
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  balanceLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  balanceLoadingText: {
    color: colors.accent.primary,
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
  },
});
