import { AuthBoundary } from '@privy-io/expo';
import { Redirect, Stack } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import theme from '../theme';

const { colors, spacing, fontSize, fontWeight } = theme;

function LoadingScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.accent.primary} />
      <Text style={styles.text}>Loading challenge...</Text>
    </View>
  );
}

function ErrorScreen({ error }: { error: Error }) {
  return (
    <View style={styles.container}>
      <Text style={styles.errorText}>Error loading challenge</Text>
      <Text style={styles.text}>{error.message}</Text>
    </View>
  );
}

export default function ChallengeLayout() {
  return (
    <AuthBoundary
      loading={<LoadingScreen />}
      error={(error) => <ErrorScreen error={error} />}
      unauthenticated={<Redirect href="/sign-in" />}
    >
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="[id]" />
      </Stack>
    </AuthBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.black,
    padding: spacing.md,
  },
  text: {
    fontSize: fontSize.md,
    color: colors.gray[400],
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  errorText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.accent.error,
    marginBottom: spacing.sm,
  },
});
