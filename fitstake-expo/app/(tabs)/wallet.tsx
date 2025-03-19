import { useEmbeddedSolanaWallet } from '@privy-io/expo';
import { ArrowDownLeft, ArrowUpRight, Wallet } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import theme from '../theme';

const { colors, spacing, borderRadius, fontSize, fontWeight, shadows } = theme;

export default function WalletScreen() {
  const { wallets } = useEmbeddedSolanaWallet();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeWallet = async () => {
      await checkWallet();
      setIsLoading(false);
    };

    initializeWallet();
  }, [wallets]);

  const checkWallet = async () => {
    try {
      if (!wallets || wallets.length === 0) {
        console.log('No wallets available');
        setWalletAddress(null);
        return;
      }

      const solanaWallet = wallets[0];

      if (!solanaWallet) {
        console.log('Solana wallet not available');
        setWalletAddress(null);
        return;
      }

      if (solanaWallet.address) {
        console.log('Wallet found with address:', solanaWallet.address);
        setWalletAddress(solanaWallet.address);
      } else {
        console.log('No address available');
        setWalletAddress(null);
      }
    } catch (error) {
      console.error('Error checking wallet:', error);
      setWalletAddress(null);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.accent.primary} />
        <Text style={styles.message}>Loading wallet information...</Text>
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
          <Text style={styles.walletAddressValue}>
            {walletAddress ? walletAddress : 'No wallet connected'}
          </Text>
        </View>

        <View style={styles.balanceCard}>
          <Wallet color={colors.white} size={32} />
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>12.5 SOL</Text>
          <View style={styles.buttonRow}>
            <Pressable style={styles.actionButton}>
              <Text style={styles.buttonText}>Deposit</Text>
            </Pressable>
            <Pressable style={styles.actionButton}>
              <Text style={styles.buttonText}>Withdraw</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <View style={styles.transactionsList}>
          <View style={styles.transactionItem}>
            <View style={styles.transactionIcon}>
              <ArrowUpRight color={colors.accent.error} size={20} />
            </View>
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionTitle}>Challenge Stake</Text>
              <Text style={styles.transactionDate}>Feb 20, 2024</Text>
            </View>
            <Text style={[styles.transactionAmount, styles.negative]}>
              -2.5 SOL
            </Text>
          </View>

          <View style={styles.transactionItem}>
            <View style={styles.transactionIcon}>
              <ArrowDownLeft color={colors.accent.secondary} size={20} />
            </View>
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionTitle}>Challenge Reward</Text>
              <Text style={styles.transactionDate}>Feb 19, 2024</Text>
            </View>
            <Text style={[styles.transactionAmount, styles.positive]}>
              +3.8 SOL
            </Text>
          </View>
        </View>
      </ScrollView>
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
});
