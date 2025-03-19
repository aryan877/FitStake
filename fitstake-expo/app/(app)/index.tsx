import { usePrivy } from '@privy-io/expo';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import theme from '../theme';

const { colors, fontSize, fontWeight, spacing } = theme;

export default function HomePage() {
  const { user } = usePrivy();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Redirect to tabs if logged in
    const initializeApp = async () => {
      if (user) {
        router.replace('/(tabs)');
      }
      setIsLoading(false);
    };

    initializeApp();
  }, [user]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.accent.primary} />
        <Text style={styles.message}>Loading your account...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.centered]}>
      <Text style={styles.title}>FitStake</Text>
      <Text style={styles.message}>Redirecting to app...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
    padding: spacing.md,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.lg,
  },
  message: {
    fontSize: fontSize.md,
    color: colors.gray[300],
    textAlign: 'center',
    marginVertical: spacing.md,
  },
});
