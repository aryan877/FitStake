import { useEmbeddedSolanaWallet, usePrivy } from '@privy-io/expo';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function HomePage() {
  const { user, logout } = usePrivy();
  const { wallets } = useEmbeddedSolanaWallet();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only check wallet and update loading state after component is mounted
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

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/sign-in');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Logout Error', 'Failed to log out. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.message}>Loading your account...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>FitStake</Text>
        <Button title="Logout" onPress={handleLogout} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Profile</Text>
        <View style={styles.card}>
          {user ? (
            <>
              <Text style={styles.label}>User ID</Text>
              <Text style={styles.value}>{user.id}</Text>
            </>
          ) : (
            <Text style={styles.value}>Loading profile...</Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Solana Wallet</Text>
        <View style={styles.card}>
          {walletAddress ? (
            <>
              <Text style={styles.label}>Address</Text>
              <Text style={styles.value}>{walletAddress}</Text>
              <Button
                title="View Challenges"
                onPress={() => router.push('/(tabs)')}
              />
            </>
          ) : (
            <Text style={styles.message}>No wallet found</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 16,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
  },
  label: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    marginVertical: 16,
  },
});
