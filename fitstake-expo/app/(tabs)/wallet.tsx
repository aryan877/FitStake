import { ArrowDownLeft, ArrowUpRight, Wallet } from 'lucide-react-native';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function WalletScreen() {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Wallet</Text>
          <Text style={styles.subtitle}>Manage your funds</Text>
        </View>

        <View style={styles.balanceCard}>
          <Wallet color="#fff" size={32} />
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
              <ArrowUpRight color="#EF4444" size={20} />
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
              <ArrowDownLeft color="#10B981" size={20} />
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
    backgroundColor: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  balanceCard: {
    margin: 20,
    padding: 24,
    backgroundColor: '#1F2937',
    borderRadius: 16,
    alignItems: 'center',
  },
  balanceLabel: {
    color: '#9CA3AF',
    fontSize: 16,
    marginTop: 12,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 40,
    fontWeight: 'bold',
    marginTop: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  actionButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
  },
  transactionsList: {
    padding: 20,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#374151',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  transactionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  transactionDate: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 4,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  positive: {
    color: '#10B981',
  },
  negative: {
    color: '#EF4444',
  },
});
